// src/screens/Authentication/signup.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView,} from 'react-native';
import Alert from '../../components/Alert'; // Import the custom Alert component

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    ageCategory: '',
    gender: '',
    jobRole: '',
    workPlace: '',
    password: '',
    confirmPassword: ''
  });

  const [dropdowns, setDropdowns] = useState({
    ageCategory: false,
    gender: false,
    jobRole: false,
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDropdown = (field) => {
    setDropdowns(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSignUp = () => {
    // Handle final submission without validation
    console.log('Form submitted:', formData);
    navigation.navigate('Questionnaire');
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    setAlertMessage('');
  };

  const InputField = ({ label, subLabel, placeholder, value, onChange, secureTextEntry = false, keyboardType = 'default' }) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{subLabel}</Text>
      <TextInput
        style={{ backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#333' }}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholderTextColor="#999"
      />
    </View>
  );

  const SelectField = ({ label, subLabel, value, onChange, options, placeholder }) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{subLabel}</Text>
      <TouchableOpacity
        style={{ 
          backgroundColor: '#F0F0F0', 
          borderRadius: 12, 
          paddingHorizontal: 16, 
          paddingVertical: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onPress={() => {
          // For now, just cycle through options on tap
          const currentIndex = options.findIndex(opt => opt.value === value);
          const nextIndex = (currentIndex + 1) % options.length;
          onChange(options[nextIndex].value);
        }}
      >
        <Text style={{ fontSize: 14, color: value ? '#333' : '#999' }}>
          {value ? options.find(opt => opt.value === value)?.label : placeholder}
        </Text>
        <Text style={{ fontSize: 14, color: '#999' }}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
           {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 40}}>
        <Text style={{ fontSize: 24, fontWeight: '600', color: '#333', marginBottom: 24, textAlign: 'center' }}>Create Account</Text>
      </View>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>

          {/* All Fields */}
          <View>
            <InputField
              label="Enter Your Name"
              subLabel="ඔබගේ නම ඇතුලත් කරන්න."
              placeholder="XXXXXXXX"
              value={formData.name}
              onChange={(val) => handleInputChange('name', val)}
            />

            <InputField
              label="Enter Your Mobile Number"
              subLabel="ඔබගේ දුරකතන අංකය ඇතුලත් කරන්න."
              placeholder="070XXXXXXX2"
              value={formData.mobile}
              onChange={(val) => handleInputChange('mobile', val)}
              keyboardType="phone-pad"
            />

            <InputField
              label="Enter Your E-mail Address"
              subLabel="ඔබගේ ඊ-මේල් ලිපිනය ඇතුලත් කරන්න."
              placeholder="XXXXXX@gmail.com"
              value={formData.email}
              onChange={(val) => handleInputChange('email', val)}
              keyboardType="email-address"
            />

            <SelectField
              label="Select Your Age Category"
              subLabel="ඔබගේ වයස් කාණ්ඩය තෝරන්න."
              placeholder="16 - 25"
              value={formData.ageCategory}
              onChange={(val) => handleInputChange('ageCategory', val)}
              options={[
                { value: '16-25', label: '16 - 25' },
                { value: '26-35', label: '26 - 35' },
                { value: '36-45', label: '36 - 45' },
                { value: '46-55', label: '46 - 55' },
                { value: '56+', label: '56+' }
              ]}
            />

            <SelectField
              label="Select Your Gender"
              subLabel="ඔබගේ ස්ත්‍රී පුරුෂ බව තෝරන්න."
              placeholder="Male"
              value={formData.gender}
              onChange={(val) => handleInputChange('gender', val)}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' }
              ]}
            />

            <SelectField
              label="Select Job Role"
              subLabel="ඔබගේ රැකියා භූමිකාව තෝරන්න."
              placeholder="Production Assistant"
              value={formData.jobRole}
              onChange={(val) => handleInputChange('jobRole', val)}
              options={[
                { value: 'production-assistant', label: 'Production Assistant' },
                { value: 'supervisor', label: 'Supervisor' },
                { value: 'manager', label: 'Manager' },
                { value: 'technician', label: 'Technician' },
                { value: 'operator', label: 'Operator' }
              ]}
            />

            <InputField
              label="Enter Your Work Place Name"
              subLabel="ඔබ සේවය කරන ආයතනයේ නම ඇතුළත් කරන්න."
              placeholder="Abc (pvt) Ltd"
              value={formData.workPlace}
              onChange={(val) => handleInputChange('workPlace', val)}
            />

            <InputField
              label="Enter New Password"
              subLabel="නව මුරපදයක් ඇතුළත් කරන්න."
              placeholder="••••••••"
              value={formData.password}
              onChange={(val) => handleInputChange('password', val)}
              secureTextEntry={true}
            />

            <InputField
              label="Re-Enter Your Password"
              subLabel="මුරපදය නැවත ඇතුළත් කරන්න."
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(val) => handleInputChange('confirmPassword', val)}
              secureTextEntry={true}
            />
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            style={{ 
              backgroundColor: '#0066B2', 
              borderRadius: 20, 
              paddingVertical: 12, 
              alignItems: 'center', 
              marginTop: 16,
              marginBottom: 30 
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
              Next
            </Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={{ fontSize: 14, color: '#0066B2', fontWeight: '600' }}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Alert
        isVisible={showAlert}
        message={alertMessage}
        onClose={handleCloseAlert}
      />
    </SafeAreaView>
  );
};

export default SignUpScreen;