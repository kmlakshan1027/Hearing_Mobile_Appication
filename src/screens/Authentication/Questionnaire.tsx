//Questionnaire.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '../../../configs/FirebaseConfig'; // adjust path to match your project structure

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Answer = string | string[] | null;

interface Answers {
  [key: number]: Answer;
}

// Exported so other screens (e.g. Generate.jsx, Profile.jsx) can reuse the
// exact same question text/IDs instead of duplicating them.
export const questions = [
  {
    id: 1,
    screen: 1,
    text: 'Do you currently experience difficulty hearing normal conversations?',
    sinhala: 'ඔබ දැනට සාමාන්‍ය සංවාදයන් ඇසීමේ අපහසුතාවයක් අත්විඳිනවාද?',
    type: 'single',
    options: ['Yes', 'No'],
  },
  {
    id: 2,
    screen: 1,
    text: 'Do you experience hearing difficulty more in one ear than the other?',
    sinhala: 'ඔබට එක් කනකට වඩා අනෙකෙහි ශ්‍රවණ අපහසුතාවක් ඇතිද?',
    type: 'single',
    options: ['Left', 'Right', 'Both', 'No'],
  },
  {
    id: 3,
    screen: 1,
    text: 'Have you experienced ear pain within the last 6 months?',
    sinhala: 'පසුගිය මාස 6 තුළ ඔබට කන් වේදනාවක් ඇති වී ඇත්ද?',
    type: 'single',
    options: ['Yes', 'No'],
  },
  {
    id: 4,
    screen: 1,
    text: 'Are you regularly exposed to loud noise at work or daily life?',
    sinhala: 'ඔබ නිරතුරු සේවා ස්ථානයේ හෝ දෛනික ජීවිතයේ ශබ්ද දූෂණයට ලක් වෙනවාද?',
    type: 'single',
    options: ['Yes', 'No'],
  },
  {
    id: 5,
    screen: 2,
    text: 'If yes, what is the main source of noise exposure?',
    sinhala: 'ඔව් නම්, ශබ්ද නිරාවරණයේ ප්‍රධාන ප්‍රභවය කුමක්ද?',
    type: 'single',
    options: [
      'Industrial machinery',
      'Construction work',
      'Music / Headphones',
      'Firearms / Explosives',
      'Other',
    ],
    conditionalOn: { questionId: 4, answer: 'Yes' },
  },
  {
    id: 6,
    screen: 2,
    text: 'Do you regularly use ear protection in noisy environments?',
    sinhala: 'ශබ්දකාර පරිසරවලදී ඔබ නිරතුරු කන් ආරක්ෂක භාවිතා කරනවාද?',
    type: 'single',
    options: ['Always', 'Sometimes', 'Never'],
  },
  {
    id: 7,
    screen: 2,
    text: 'How long have you been exposed to loud noise?',
    sinhala: 'ඔබ කොපමණ කාලයක් සිට ශබ්ද දූෂණයට ලක් වන්නේද?',
    type: 'single',
    options: ['Less than 1 Year', '1–5 years', '5–10 years', 'More than 10 years'],
  },
  {
    id: 8,
    screen: 2,
    text: 'Have you undergone a hearing test before?',
    sinhala: 'ඔබ ඊට පෙර ශ්‍රවණ පරීක්ෂාවකට භාජනය වී තිබේද?',
    type: 'single',
    options: ['Yes', 'No'],
  },
  {
    id: 9,
    screen: 3,
    text: 'Do you have a family history of hearing loss?',
    sinhala: 'ඔබේ පවුලේ ශ්‍රවණ බාධිත පසුබිමක් ඇත්ද?',
    type: 'single',
    options: ['Yes', 'No'],
  },
];

interface CheckboxOptionProps {
  label: string;
  checked: boolean;
  onPress: () => void;
}

const CheckboxOption: React.FC<CheckboxOptionProps> = ({ label, checked, onPress }) => {
  return (
    <TouchableOpacity 
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 4,
      }} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={{
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: checked ? '#1A3C6E' : '#9CA3AF',
        borderRadius: 3,
        backgroundColor: checked ? '#1A3C6E' : '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
      }}>
        {checked && <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', lineHeight: 16 }}>✓</Text>}
      </View>
      <Text style={{ fontSize: 13, color: '#374151', fontWeight: '500' }}>{label}</Text>
    </TouchableOpacity>
  );
};

interface QuestionBlockProps {
  index: number;
  question: (typeof questions)[0];
  answer: Answer;
  onSelect: (questionId: number, value: string) => void;
}

const QuestionBlock: React.FC<QuestionBlockProps> = ({ index, question, answer, onSelect }) => {
  const isHorizontal = question.options.length <= 4 && question.options.every(o => o.length <= 10);

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20, marginBottom: 3 }}>
        {index}. {question.text}
      </Text>
      <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 18, fontStyle: 'italic', marginBottom: 10 }}>
        {question.sinhala}
      </Text>

      <View style={isHorizontal ? { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } : { flexDirection: 'column', gap: 6 }}>
        {question.options.map(option => (
          <CheckboxOption
            key={option}
            label={option}
            checked={answer === option}
            onPress={() => onSelect(question.id, option)}
          />
        ))}
      </View>
    </View>
  );
};

const Questionnaire: React.FC<any> = ({ navigation, route }) => {
  const { signupData, editMode, initialAnswers, uid } = route.params || {};
  const [answers, setAnswers] = useState<Answers>(initialAnswers || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // ── Registration flow: move on to Terms & Conditions ──
  const handleSubmit = () => {
    console.log('Questionnaire complete:', answers);
    navigation.navigate('Terms', { 
      signupData, 
      questionnaireData: answers 
    });
  };

  // ── Edit-from-Profile flow: save directly to Firestore, no Terms step ──
  const handleSaveEdit = async () => {
    const targetUid = uid || getAuth(app).currentUser?.uid;
    if (!targetUid) {
      Alert.alert('Error', 'No signed-in user found.');
      return;
    }
    setIsSaving(true);
    try {
      const db = getFirestore(app);
      await updateDoc(doc(db, 'Auth', targetUid), {
        medicalHistory: answers,
        // Marks WHEN the medical history last changed, independent of test
        // dates — the Dashboard compares this against the latest report's
        // date to decide whether to prompt the user to retake a test.
        medicalHistoryUpdatedAt: new Date().toISOString(),
      });
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save medical history:', err);
      Alert.alert('Update Failed', 'Could not save your changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            {/* ── Header ── */}
            <View style={{
              backgroundColor: '#1A3C6E',
              paddingTop: 60, paddingHorizontal: 20,
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.08)',
            }}>
        <Text style={{ fontSize: 24, fontWeight: '600', color: '#ffffff', marginBottom: 15, textAlign: 'center' }}>
          {editMode ? 'Edit Medical History' : 'Medical History'}
        </Text>
        </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {questions.map((q, i) => (
          <QuestionBlock
            key={q.id}
            index={i + 1}
            question={q}
            answer={answers[q.id] ?? null}
            onSelect={handleSelect}
          />
        ))}

        <View style={{ height: 100 }} />

        <View style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          backgroundColor: '#FFFFFF', 
          paddingHorizontal: 20, 
          paddingBottom: 28, 
          paddingTop: 12 
        }}>
          {editMode && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={isSaving}
              style={{
                borderRadius: 20,
                paddingVertical: 12,
                alignItems: 'center',
                marginBottom: 10,
                borderWidth: 1.5,
                borderColor: '#CBD5E1',
              }}
            >
              <Text style={{ color: '#475569', fontSize: 15, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={editMode ? handleSaveEdit : handleSubmit}
            disabled={isSaving}
            style={{ 
              backgroundColor: '#1A3C6E', 
              borderRadius: 20, 
              paddingVertical: 12, 
              alignItems: 'center', 
              marginTop: 2,
              marginBottom: 30,
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
                {editMode ? 'Save Changes' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {!editMode && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={{ fontSize: 14, color: '#1A3C6E', fontWeight: '600' }}>Sign in</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Questionnaire;