import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Svg, Path } from 'react-native-svg';

import { AppColors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

type CitationLink = {
  title: string;
  description?: string;
  url: string;
};

type CitationSection = {
  title: string;
  items: CitationLink[];
};

const DISCLAIMER_PARAGRAPHS = [
  'Recovery Compass provides educational guidance, behavioral support, audio guidance, and wellness practices designed to support healthier habits and daily balance.',
  'It is not intended to diagnose, treat, cure, or prevent any disease or medical condition, and it is not a substitute for professional medical advice, diagnosis, or treatment.',
  'Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay seeking it because of information provided through this app.',
  'If you are experiencing urgent symptoms, severe distress, or a medical emergency, seek immediate medical attention or contact local emergency services.',
];

const BEFORE_YOU_BEGIN_POINTS = [
  'Consult your doctor before starting any programme if you have a chronic condition, are pregnant, are breastfeeding, are recovering from surgery or injury, or are taking prescription medication.',
  'Stop any activity immediately if you feel pain, dizziness, shortness of breath, unusual fatigue, jaw discomfort, headaches, skin irritation, or anything else that does not feel right.',
  'Do not rely on Recovery Compass for emergency situations or urgent medical decisions.',
];

const AGE_REVERSAL_CAUTION_POINTS = [
  'Facial exercises should never cause pain. Stop if you experience jaw clicking, headaches, skin irritation, or facial discomfort.',
  "Do not continue if you have had recent facial surgery, botox or fillers, Bell's palsy, TMJ disorder, or active skin conditions.",
];

const SOURCES_INTRO =
  'Recovery Compass draws on peer-reviewed research, clinical guidelines, and established wellness frameworks to inform the design of its programmes and content. The references below support the general educational direction of the app and are provided as part of our commitment to transparency and evidence-informed wellness practices.';

const CITATION_SECTIONS: CitationSection[] = [
  {
    title: 'Smoking cessation & nicotine addiction',
    items: [
      {
        title: 'World Health Organization (WHO) – Tobacco Fact Sheet',
        description: 'Reference for tobacco harm, prevalence, and public-health context.',
        url: 'https://www.who.int/news-room/fact-sheets/detail/tobacco',
      },
      {
        title: 'Centers for Disease Control and Prevention (CDC) – About Tobacco',
        description: 'Background context on tobacco use and health effects.',
        url: 'https://www.cdc.gov/tobacco/about/index.html',
      },
      {
        title: 'Centers for Disease Control and Prevention (CDC) – Benefits of Quitting',
        description: 'Supports educational content around the benefits of quitting.',
        url: 'https://www.cdc.gov/tobacco/about/benefits-of-quitting.html',
      },
      {
        title: 'National Health Service (NHS) – Stop Smoking Support and Services',
        description: 'Practical guidance on smoking cessation support pathways.',
        url: 'https://www.nhs.uk/live-well/quit-smoking/nhs-stop-smoking-services-help-you-quit/',
      },
      {
        title: 'Mayo Clinic – Nicotine Dependence: Symptoms and Causes',
        description: 'Supports educational framing around nicotine dependence.',
        url: 'https://www.mayoclinic.org/diseases-conditions/nicotine-dependence/symptoms-causes/syc-20351584',
      },
      {
        title: 'Mayo Clinic – Coping with Nicotine Cravings',
        description: 'Supports craving-management and urge-response guidance.',
        url: 'https://www.mayoclinic.org/diseases-conditions/nicotine-dependence/in-depth/nicotine-craving/art-20045454',
      },
      {
        title: 'Journal of Addiction Research – Craving and Urge Management in Addiction Behaviour',
        description: 'Supports educational content around craving awareness and behavioral response.',
        url: 'https://www.addictionresearch.com',
      },
    ],
  },
  {
    title: 'Male sexual health & pelvic floor training',
    items: [
      {
        title: 'Mayo Clinic – Pelvic Floor Muscle Exercises',
        description: 'Supports educational guidance around pelvic floor training.',
        url: 'https://www.mayoclinic.org',
      },
      {
        title: 'Cleveland Clinic – Pelvic Floor Exercises: Benefits for Sexual Function',
        description: 'Supports wellness education around sexual-function support.',
        url: 'https://my.clevelandclinic.org',
      },
      {
        title: 'National Health Service (NHS) – Pelvic Floor Exercises for Men',
        description: 'General educational guidance for men’s pelvic floor exercise practice.',
        url: 'https://www.nhs.uk',
      },
      {
        title: 'International Society for Sexual Medicine (ISSM) – Pelvic Floor Exercises and Erectile Function',
        description: 'Supports educational framing for pelvic floor and sexual health content.',
        url: 'https://www.issm.info',
      },
      {
        title: 'European Association of Urology – Pelvic Floor Training in ED Management Guidelines',
        description: 'Supports evidence-informed context for men’s health programming.',
        url: 'https://www.uroweb.org',
      },
    ],
  },
  {
    title: 'Exercise, circulation & cardiovascular health',
    items: [
      {
        title: 'Harvard Medical School – Physical Activity and Sexual Health',
        description: 'Supports educational guidance around movement and circulation.',
        url: 'https://www.health.harvard.edu',
      },
      {
        title: 'American Heart Association – Walking and Vascular Function',
        description: 'Supports general wellness guidance around daily movement and cardiovascular support.',
        url: 'https://www.heart.org',
      },
    ],
  },
  {
    title: 'Stress reduction & breathing techniques',
    items: [
      {
        title: 'American Psychological Association – Breathing Exercises and Stress Control',
        description: 'Supports breathing and stress-regulation education.',
        url: 'https://www.apa.org',
      },
      {
        title: 'Cleveland Clinic – Relaxation Techniques and the Nervous System',
        description: 'Supports calmer recovery and regulation practices.',
        url: 'https://my.clevelandclinic.org',
      },
      {
        title: 'National Institutes of Health (NIH) – Balanced Muscle Training and Recovery',
        description: 'Supports recovery-oriented wellness guidance.',
        url: 'https://www.nih.gov',
      },
    ],
  },
  {
    title: 'Sleep hygiene & circadian health',
    items: [
      {
        title: "National Institute on Aging (NIH) – A Good Night's Sleep",
        description: 'Supports general sleep-health education and habit building.',
        url: 'https://www.nia.nih.gov/health/sleep/good-nights-sleep',
      },
      {
        title: 'Mayo Clinic – Sleep Hygiene: 6 Tips for Better Sleep',
        description: 'Supports educational guidance around sleep routines and hygiene.',
        url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/sleep/art-20048379',
      },
      {
        title: 'National Sleep Foundation – Sleep Hygiene and Tips',
        description: 'Supports practical lifestyle guidance for better sleep.',
        url: 'https://www.thensf.org/sleep-tips/',
      },
    ],
  },
  {
    title: 'Nutrition, energy & fatigue management',
    items: [
      {
        title: 'Harvard Health Publishing – 9 Tips to Boost Your Energy — Naturally',
        description: 'Supports educational guidance around daily energy habits.',
        url: 'https://www.health.harvard.edu/energy-and-fatigue/9-tips-to-boost-your-energy-naturally',
      },
      {
        title: 'Cleveland Clinic – How to Boost Your Energy Levels',
        description: 'Supports practical wellness guidance for fatigue and energy balance.',
        url: 'https://health.clevelandclinic.org/how-to-boost-your-energy-levels/',
      },
      {
        title: 'National Health Service (NHS) – Self-help Tips to Fight Fatigue',
        description: 'Supports general fatigue-management education.',
        url: 'https://www.nhs.uk/live-well/sleep-and-tiredness/self-help-tips-to-fight-fatigue/',
      },
    ],
  },
  {
    title: 'Longevity & healthy aging lifestyle',
    items: [
      {
        title: 'National Institute on Aging (NIH) – Healthy Aging Resource Center',
        description: 'Supports healthy-aging and lifestyle-education content.',
        url: 'https://www.nia.nih.gov/health/healthy-aging',
      },
      {
        title: 'Harvard Medical School – Longevity: Lifestyle Strategies for a Healthy, Long Life',
        description: 'Supports educational context for long-term healthy habits.',
        url: 'https://www.health.harvard.edu/topics/longevity',
      },
      {
        title: 'American Academy of Dermatology (AAD) – Anti-Aging Skin Care',
        description: 'Supports general healthy-aging and self-care education.',
        url: 'https://www.aad.org/public/everyday-care/skin-care-basics/ant-aging',
      },
    ],
  },
];

function SectionEye({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: 'Satoshi-Bold',
        fontSize: 9,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: 'rgba(6,41,12,0.35)',
        marginBottom: 10,
        paddingLeft: 4,
      }}
    >
      {children}
    </Text>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(6,41,12,0.05)',
          shadowColor: '#06290C',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 24,
          elevation: 4,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function CitationRow({ item, isLast }: { item: CitationLink; isLast: boolean }) {
  const handleOpen = async () => {
    try {
      await Linking.openURL(item.url);
    } catch (error: any) {
      Alert.alert('Could not open source', error?.message ?? 'Please try again.');
    }
  };

  return (
    <TouchableOpacity
      onPress={() => void handleOpen()}
      activeOpacity={0.75}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: 'rgba(6,41,12,0.05)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: AppColors.sageSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            marginTop: 1,
          }}
        >
          <IconSymbol name="doc.text" size={15} color="rgba(6,41,12,0.55)" />
        </View>

        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={{
              fontFamily: 'Satoshi-Medium',
              fontSize: 13,
              lineHeight: 18,
              color: AppColors.forest,
            }}
          >
            {item.title}
          </Text>
          {item.description ? (
            <Text
              style={{
                fontFamily: 'Satoshi-Regular',
                fontSize: 11,
                lineHeight: 16,
                color: 'rgba(6,41,12,0.5)',
                marginTop: 4,
              }}
            >
              {item.description}
            </Text>
          ) : null}
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Satoshi-Regular',
              fontSize: 10,
              lineHeight: 14,
              color: 'rgba(6,41,12,0.38)',
              marginTop: 6,
            }}
          >
            {item.url}
          </Text>
        </View>

        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: 'rgba(6,41,12,0.04)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSymbol name="chevron.right" size={14} color="rgba(6,41,12,0.28)" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CitationsScreen() {
  const router = useRouter();

  const handleOpenWebsite = async () => {
    try {
      await Linking.openURL('https://recoverycompass.co/citations');
    } catch (error: any) {
      Alert.alert('Could not open link', error?.message ?? 'Please try again.');
    }
  };

  const handleEmail = async () => {
    try {
      await Linking.openURL('mailto:support@recoverycompass.co');
    } catch (error: any) {
      Alert.alert('Could not open email', error?.message ?? 'Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.forest }}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: AppColors.forest }}>
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 52,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Svg
              style={{ position: 'absolute', right: -16, top: -14, opacity: 0.06 }}
              width={180}
              height={180}
              viewBox="0 0 200 200"
              fill="none"
            >
              <Path d="M100 10C100 10 165 55 165 105C165 148 135 182 100 192C65 182 35 148 35 105C35 55 100 10 100 10Z" fill="#E3F3E5" />
              <Path d="M100 98L100 192" stroke="#E3F3E5" strokeWidth="1.5" />
              <Path d="M100 120C80 110 65 125 60 140" stroke="#E3F3E5" strokeWidth="1" />
            </Svg>

            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(227,243,229,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(227,243,229,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <IconSymbol name="arrow.left" size={12} color="rgba(227,243,229,0.75)" />
            </TouchableOpacity>

            <Text
              style={{
                fontFamily: 'Satoshi-Medium',
                fontSize: 10,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: 'rgba(227,243,229,0.5)',
              }}
            >
              Transparency & safety
            </Text>
            <Text
              style={{
                fontFamily: 'Erode-Medium',
                fontSize: 30,
                color: '#FFFFFF',
                lineHeight: 34,
                letterSpacing: -0.6,
                marginTop: 4,
              }}
            >
              Medical Disclaimer & Sources
            </Text>
            <Text
              style={{
                fontFamily: 'Satoshi-Regular',
                fontSize: 13,
                lineHeight: 19,
                color: 'rgba(227,243,229,0.62)',
                marginTop: 10,
                maxWidth: 320,
              }}
            >
              Clear wellness guidance, with the source context behind the content you see in Recovery Compass.
            </Text>
          </View>
        </SafeAreaView>

        <View
          style={{
            flex: 1,
            backgroundColor: AppColors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            marginTop: -28,
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 60,
          }}
        >
          <SectionEye>Disclaimer</SectionEye>
          <Card style={{ padding: 18, marginBottom: 24 }}>
            {DISCLAIMER_PARAGRAPHS.map((paragraph, index) => (
              <Text
                key={paragraph}
                style={{
                  fontFamily: 'Satoshi-Regular',
                  fontSize: 13,
                  lineHeight: 20,
                  color: index === 0 ? AppColors.forest : 'rgba(6,41,12,0.62)',
                  marginBottom: index === DISCLAIMER_PARAGRAPHS.length - 1 ? 0 : 14,
                }}
              >
                {paragraph}
              </Text>
            ))}

            <View
              style={{
                marginTop: 18,
                backgroundColor: AppColors.sageSoft,
                borderRadius: 18,
                paddingHorizontal: 14,
                paddingVertical: 14,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Satoshi-Bold',
                  fontSize: 10,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: 'rgba(6,41,12,0.42)',
                  marginBottom: 10,
                }}
              >
                Before you begin
              </Text>

              {BEFORE_YOU_BEGIN_POINTS.map((point, index) => (
                <View
                  key={point}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: index === BEFORE_YOU_BEGIN_POINTS.length - 1 ? 0 : 10,
                  }}
                >
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: AppColors.forest,
                      marginTop: 7,
                      marginRight: 10,
                    }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: 'Satoshi-Regular',
                      fontSize: 12,
                      lineHeight: 18,
                      color: 'rgba(6,41,12,0.68)',
                    }}
                  >
                    {point}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <SectionEye>About our sources</SectionEye>
          <Card style={{ padding: 18, marginBottom: 24 }}>
            <Text
              style={{
                fontFamily: 'Satoshi-Regular',
                fontSize: 13,
                lineHeight: 20,
                color: 'rgba(6,41,12,0.62)',
              }}
            >
              {SOURCES_INTRO}
            </Text>

            <View style={{ marginTop: 16, gap: 10 }}>
              <View
                style={{
                  backgroundColor: AppColors.sageSoft,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Satoshi-Medium',
                    fontSize: 12,
                    color: AppColors.forest,
                    lineHeight: 18,
                  }}
                >
                  Recovery Compass is an educational wellness app and does not replace professional medical advice.
                </Text>
              </View>
            </View>
          </Card>

          <SectionEye>Age reversal safety</SectionEye>
          <Card style={{ padding: 18, marginBottom: 24 }}>
            <Text
              style={{
                fontFamily: 'Satoshi-Regular',
                fontSize: 13,
                lineHeight: 20,
                color: 'rgba(6,41,12,0.62)',
                marginBottom: 14,
              }}
            >
              The Age Reversal programme includes facial exercises and recovery routines. Use extra caution and pause immediately if anything feels off.
            </Text>

            {AGE_REVERSAL_CAUTION_POINTS.map((point, index) => (
              <View
                key={point}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: index === AGE_REVERSAL_CAUTION_POINTS.length - 1 ? 0 : 10,
                }}
              >
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: '#B93A2B',
                    marginTop: 7,
                    marginRight: 10,
                  }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: 'Satoshi-Medium',
                    fontSize: 12,
                    lineHeight: 18,
                    color: AppColors.forest,
                  }}
                >
                  {point}
                </Text>
              </View>
            ))}
          </Card>

          {CITATION_SECTIONS.map((section) => (
            <View key={section.title} style={{ marginBottom: 24 }}>
              <SectionEye>{section.title}</SectionEye>
              <Card>
                {section.items.map((item, index) => (
                  <CitationRow key={item.title} item={item} isLast={index === section.items.length - 1} />
                ))}
              </Card>
            </View>
          ))}

          <SectionEye>Questions about our sources</SectionEye>
          <Card style={{ padding: 18, marginBottom: 12 }}>
            <Text
              style={{
                fontFamily: 'Satoshi-Regular',
                fontSize: 13,
                lineHeight: 20,
                color: 'rgba(6,41,12,0.62)',
                marginBottom: 16,
              }}
            >
              If you have questions about the research behind our programmes or would like to request additional references, you can reach us directly or view the live citations page on our website.
            </Text>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => void handleEmail()}
                activeOpacity={0.8}
                style={{
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: AppColors.forest,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#FFFFFF' }}>
                  Email support@recoverycompass.co
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => void handleOpenWebsite()}
                activeOpacity={0.75}
                style={{
                  height: 46,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(6,41,12,0.08)',
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 13, color: AppColors.forest }}>
                  View full citations page
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          <View style={{ marginTop: 18, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Satoshi-Regular', fontSize: 10, color: 'rgba(6,41,12,0.28)' }}>
              Last updated: April 2026
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
