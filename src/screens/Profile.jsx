// Profile.jsx  –  User Profile Screen
// Shows the signed-in user's own details from Firestore (Auth collection,
// doc keyed by uid — same pattern signup.jsx/signin.jsx already use).
// Supports: editing non-locked profile fields, editing Medical History
// (routes through Questionnaire.tsx in edit mode), sign out, and permanent
// account deletion.
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StatusBar, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import {
  getAuth, signOut, deleteUser,
  EmailAuthProvider, reauthenticateWithCredential,
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { app } from '../../configs/FirebaseConfig'; // adjust path to match your project structure
import { questions as QUESTIONNAIRE_QUESTIONS } from './Authentication/Questionnaire';

const AGE_OPTIONS = [
  { value: '16-25', label: '16 - 25' },
  { value: '26-35', label: '26 - 35' },
  { value: '36-45', label: '36 - 45' },
  { value: '46-55', label: '46 - 55' },
  { value: '56+', label: '56+' },
];
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
const JOB_OPTIONS = [
  { value: 'production-assistant', label: 'Production Assistant' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'manager', label: 'Manager' },
  { value: 'technician', label: 'Technician' },
  { value: 'operator', label: 'Operator' },
];

const getGenderIcon = (gender) => {
  if (gender === 'male') return '👨';
  if (gender === 'female') return '👩';
  return '🧑';
};

const labelFor = (options, value) => options.find((o) => o.value === value)?.label || value || '—';

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [userData, setUserData] = useState(null);
  const uid = getAuth(app).currentUser?.uid;

  // ── Edit Profile state ──
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ mobile: '', ageCategory: '', gender: '', jobRole: '', workPlace: '' });

  // ── Delete Account state ──
  const [isDeleting, setIsDeleting] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');

  // ── Live Firestore listener: own document, keyed directly by uid ──
  useEffect(() => {
    if (!uid) {
      setErrorMsg('No signed-in user found.');
      setLoading(false);
      return;
    }
    const db = getFirestore(app);
    const userDocRef = doc(db, 'Auth', uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          setEditForm({
            mobile: data.mobile || '',
            ageCategory: data.ageCategory || '',
            gender: data.gender || '',
            jobRole: data.jobRole || '',
            workPlace: data.workPlace || '',
          });
          setErrorMsg(null);
        } else {
          setErrorMsg('Profile not found.');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load profile:', err);
        setErrorMsg('Failed to load profile.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  // ── Save edited profile fields (username & password are NEVER editable here) ──
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const db = getFirestore(app);
      await updateDoc(doc(db, 'Auth', uid), { ...editForm });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      Alert.alert('Update Failed', 'Could not save your changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditForm({
      mobile: userData?.mobile || '',
      ageCategory: userData?.ageCategory || '',
      gender: userData?.gender || '',
      jobRole: userData?.jobRole || '',
      workPlace: userData?.workPlace || '',
    });
    setIsEditing(false);
  };

  const cycleOption = (field, options) => {
    const currentIndex = options.findIndex((o) => o.value === editForm[field]);
    const nextIndex = (currentIndex + 1) % options.length;
    setEditForm((prev) => ({ ...prev, [field]: options[nextIndex].value }));
  };

  // ── Navigate to Questionnaire in edit mode ──
  const handleEditMedicalHistory = () => {
    navigation.navigate('Questionnaire', {
      editMode: true,
      initialAnswers: userData?.medicalHistory || {},
      uid,
    });
  };

  // ── Sign Out ──
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(getAuth(app));
            navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
          } catch (err) {
            console.error('Sign out failed:', err);
            Alert.alert('Error', 'Could not sign out. Please try again.');
          }
        },
      },
    ]);
  };

  // ── Delete Account (permanent) ──
  const performDelete = async () => {
    setIsDeleting(true);
    try {
      const auth = getAuth(app);
      const db = getFirestore(app);
      // Delete the Firestore profile first, then the Auth account itself.
      await deleteDoc(doc(db, 'Auth', uid));
      await deleteUser(auth.currentUser);
      navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
    } catch (err) {
      console.error('Failed to delete account:', err);
      if (err?.code === 'auth/requires-recent-login') {
        // Firebase requires a recent sign-in for destructive account actions.
        setNeedsReauth(true);
      } else {
        Alert.alert('Delete Failed', 'Could not delete your account. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your test reports. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Permanently', style: 'destructive', onPress: performDelete },
      ]
    );
  };

  const handleReauthAndDelete = async () => {
    if (!reauthPassword) return;
    setIsDeleting(true);
    try {
      const auth = getAuth(app);
      // Re-authenticate using the account's real (synthetic) Auth email,
      // not the displayed Username — Firebase Auth needs the actual identifier.
      const credential = EmailAuthProvider.credential(auth.currentUser.email, reauthPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      setNeedsReauth(false);
      setReauthPassword('');
      await performDelete();
    } catch (err) {
      console.error('Re-authentication failed:', err);
      Alert.alert('Incorrect Password', 'Please enter your current password correctly.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1A3C6E" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3C6E" />

      {/* ── Header ── */}
      <View style={{
        backgroundColor: '#1A3C6E',
        paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center',
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, width: 70 }}
        >
          <Text style={{ color: '#A8C4E0', fontSize: 18 }}>‹</Text>
          <Text style={{ color: '#A8C4E0', fontSize: 13, fontWeight: '500' }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, color: '#FFFFFF', fontSize: 19, fontWeight: '700', textAlign: 'center', marginRight: 70 }}>
          My Profile
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {errorMsg && (
          <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}>
            <Text style={{ fontSize: 12, color: '#991B1B' }}>{errorMsg}</Text>
          </View>
        )}

        {userData && (
          <>
            {/* ── Avatar + Name ── */}
            <View style={{ alignItems: 'center', gap: 8 }}>
              <View style={{
                width: 84, height: 84, borderRadius: 42,
                backgroundColor: '#EEF2FF',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 3, borderColor: '#1A3C6E20',
              }}>
                <Text style={{ fontSize: 40 }}>{getGenderIcon(userData.gender)}</Text>
              </View>
              <Text style={{ fontSize: 19, fontWeight: '800', color: '#1E293B' }}>{userData.name}</Text>
              <Text style={{ fontSize: 12.5, color: '#94A3B8' }}>@{userData.username || 'unknown'}</Text>
              {userData.employeeId && (
                <View style={{
                  backgroundColor: '#EEF2FF', borderRadius: 20,
                  paddingHorizontal: 12, paddingVertical: 4,
                  marginTop: 2,
                }}>
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#1A3C6E', letterSpacing: 0.4 }}>
                    {userData.employeeId}
                  </Text>
                </View>
              )}
            </View>

            {/* ── Account Details ── */}
            <Section
              title="Account Details"
              action={
                isEditing ? null : (
                  <TouchableOpacity onPress={() => setIsEditing(true)} activeOpacity={0.7}>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#1A3C6E' }}>Edit</Text>
                  </TouchableOpacity>
                )
              }
            >
              <Card>
                {/* Locked fields */}
                <InfoRow label="Employee ID" value={userData.employeeId || '—'} locked />
                <Divider />
                <InfoRow label="Username" value={userData.username || '—'} locked />
                <Divider />

                {isEditing ? (
                  <>
                    <EditTextRow
                      label="Mobile Number"
                      value={editForm.mobile}
                      onChangeText={(v) => setEditForm((p) => ({ ...p, mobile: v }))}
                      keyboardType="phone-pad"
                    />
                    <EditSelectRow
                      label="Age Category"
                      value={labelFor(AGE_OPTIONS, editForm.ageCategory)}
                      onPress={() => cycleOption('ageCategory', AGE_OPTIONS)}
                    />
                    <EditSelectRow
                      label="Gender"
                      value={labelFor(GENDER_OPTIONS, editForm.gender)}
                      onPress={() => cycleOption('gender', GENDER_OPTIONS)}
                    />
                    <EditSelectRow
                      label="Job Role"
                      value={labelFor(JOB_OPTIONS, editForm.jobRole)}
                      onPress={() => cycleOption('jobRole', JOB_OPTIONS)}
                    />
                    <EditTextRow
                      label="Work Place"
                      value={editForm.workPlace}
                      onChangeText={(v) => setEditForm((p) => ({ ...p, workPlace: v }))}
                      last
                    />

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                      <TouchableOpacity
                        onPress={cancelEditing}
                        disabled={isSaving}
                        style={{ flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F1F5F9' }}
                      >
                        <Text style={{ color: '#475569', fontWeight: '700', fontSize: 13.5 }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSaveProfile}
                        disabled={isSaving}
                        style={{ flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#1A3C6E', opacity: isSaving ? 0.7 : 1 }}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13.5 }}>Save Changes</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <InfoRow label="Mobile Number" value={userData.mobile || '—'} />
                    <InfoRow label="Age Category" value={labelFor(AGE_OPTIONS, userData.ageCategory)} />
                    <InfoRow label="Gender" value={labelFor(GENDER_OPTIONS, userData.gender)} />
                    <InfoRow label="Job Role" value={labelFor(JOB_OPTIONS, userData.jobRole)} />
                    <InfoRow label="Work Place" value={userData.workPlace || '—'} last />
                  </>
                )}
              </Card>
              {!isEditing && (
                <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, paddingHorizontal: 2 }}>
                  Username and password cannot be changed. Contact support if you need help with account access.
                </Text>
              )}
            </Section>

            {/* ── Medical History ── */}
            <Section
              title="Medical History"
              action={
                <TouchableOpacity onPress={handleEditMedicalHistory} activeOpacity={0.7}>
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#1A3C6E' }}>Edit</Text>
                </TouchableOpacity>
              }
            >
              <Card>
                {QUESTIONNAIRE_QUESTIONS.map((q, index) => (
                  <View key={q.id} style={{ paddingVertical: 8, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: '#F1F5F9' }}>
                    <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 17 }}>{q.text}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A3C6E', marginTop: 2 }}>
                      {userData.medicalHistory?.[q.id] ?? 'Not answered'}
                    </Text>
                  </View>
                ))}
              </Card>
              <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, paddingHorizontal: 2 }}>
                Changing your medical history may affect your risk assessment — we'll remind you on the Dashboard to retake a test.
              </Text>
            </Section>

            {/* ── Sign Out ── */}
            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.75}
              style={{
                borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#CBD5E1',
              }}
            >
              <Text style={{ color: '#475569', fontSize: 15, fontWeight: '700' }}>Sign Out</Text>
            </TouchableOpacity>

            {/* ── Delete Account (danger zone) ── */}
            <View style={{ gap: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444', letterSpacing: 0.3 }}>
                DANGER ZONE
              </Text>

              {needsReauth ? (
                <Card>
                  <Text style={{ fontSize: 12.5, color: '#374151', lineHeight: 18, marginBottom: 10 }}>
                    For your security, please re-enter your password to confirm account deletion.
                  </Text>
                  <TextInput
                    value={reauthPassword}
                    onChangeText={setReauthPassword}
                    secureTextEntry
                    placeholder="Current password"
                    placeholderTextColor="#94A3B8"
                    style={{ backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13.5, marginBottom: 10 }}
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => { setNeedsReauth(false); setReauthPassword(''); }}
                      style={{ flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F1F5F9' }}
                    >
                      <Text style={{ color: '#475569', fontWeight: '700', fontSize: 13.5 }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleReauthAndDelete}
                      disabled={isDeleting || !reauthPassword}
                      style={{ flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#EF4444', opacity: isDeleting || !reauthPassword ? 0.6 : 1 }}
                    >
                      {isDeleting ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13.5 }}>Confirm Delete</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </Card>
              ) : (
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  disabled={isDeleting}
                  activeOpacity={0.75}
                  style={{
                    borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                    backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA',
                    opacity: isDeleting ? 0.7 : 1,
                  }}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '700' }}>Delete Account</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

/* ─────────────────────────── Sub-components ─────────────────────────── */

const Section = ({ title, children, action }) => (
  <View style={{ gap: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E293B' }}>{title}</Text>
      {action}
    </View>
    {children}
  </View>
);

const Card = ({ children }) => (
  <View style={{
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  }}>
    {children}
  </View>
);

const Divider = () => <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 }} />;

const InfoRow = ({ label, value, locked = false, last = false }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Text style={{ fontSize: 12.5, color: '#64748B' }}>{label}</Text>
      {locked && <Text style={{ fontSize: 11 }}>🔒</Text>}
    </View>
    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>{value}</Text>
  </View>
);

const EditTextRow = ({ label, value, onChangeText, keyboardType = 'default', last = false }) => (
  <View style={{ paddingVertical: 6 }}>
    <Text style={{ fontSize: 11.5, color: '#64748B', marginBottom: 5 }}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      style={{ backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, color: '#1E293B' }}
    />
  </View>
);

const EditSelectRow = ({ label, value, onPress }) => (
  <View style={{ paddingVertical: 6 }}>
    <Text style={{ fontSize: 11.5, color: '#64748B', marginBottom: 5 }}>{label}</Text>
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 13.5, color: '#1E293B', fontWeight: '600' }}>{value}</Text>
      <Text style={{ fontSize: 12, color: '#94A3B8' }}>▼ tap to change</Text>
    </TouchableOpacity>
  </View>
);

export default ProfileScreen;