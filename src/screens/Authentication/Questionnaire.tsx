import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Answer = string | string[] | null;

interface Answers {
  [key: number]: Answer;
}

const questions = [
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
        borderColor: checked ? '#0066B2' : '#9CA3AF',
        borderRadius: 3,
        backgroundColor: checked ? '#0066B2' : '#FFFFFF',
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

const Questionnaire: React.FC<any> = ({ navigation }) => {
  const [answers, setAnswers] = useState<Answers>({});

  const handleSelect = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    console.log('Questionnaire complete:', answers);
    navigation.navigate('Terms');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: '600', color: '#333', marginBottom: 15, textAlign: 'center' }}>
          Medical History
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
          <TouchableOpacity
            onPress={handleSubmit}
            style={{ 
              backgroundColor: '#0066B2', 
              borderRadius: 20, 
              paddingVertical: 12, 
              alignItems: 'center', 
              marginTop: 2,
              marginBottom: 30 
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
              Next
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ fontSize: 14, color: '#666' }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={{ fontSize: 14, color: '#0066B2', fontWeight: '600' }}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Questionnaire;