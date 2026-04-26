import React, {useRef, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions} from 'react-native';
import {COLORS, SPACING, RADIUS} from '../../utils/theme';
import {LinearGradient} from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const {width} = Dimensions.get('window');

export default function WelcomeScreen({navigation}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.bgBase, '#1e293b', COLORS.bgBase]}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View style={[styles.content, {opacity: fadeAnim, transform: [{translateY: slideAnim}]}]}>
        <View style={styles.heroGroup}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>R</Text>
          </View>
          <Text style={styles.title}>Retail<Text style={styles.boldText}>Pro</Text></Text>
          <Text style={styles.subtitle}>Streamlining your business so you can focus on growth.</Text>
        </View>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <View style={styles.iconBg}><Feather name="trending-up" size={18} color={COLORS.accent} /></View>
            <Text style={styles.featureText}>Accelerate Revenue</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.iconBg}><Feather name="box" size={18} color={COLORS.green} /></View>
            <Text style={styles.featureText}>Live Inventory Control</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.iconBg}><Feather name="file-text" size={18} color={COLORS.amber} /></View>
            <Text style={styles.featureText}>Smart Invoicing</Text>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <LinearGradient
              colors={[COLORS.accent, '#2563eb']}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Get Started Now</Text>
              <Feather name="arrow-right" size={18} color="#fff" style={{marginLeft: 8}}/>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.bgBase},
  content: {flex: 1, justifyContent: 'space-evenly', alignItems: 'center', padding: SPACING.xl, maxWidth: 500, width: '100%', alignSelf: 'center'},
  heroGroup: {alignItems: 'center', marginTop: 40},
  logoMark: {
    width: 72, height: 72, 
    backgroundColor: COLORS.accent, 
    borderRadius: RADIUS.xl, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.accent,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  logoLetter: {color: '#fff', fontSize: 36, fontWeight: '800'},
  title: {fontSize: 34, color: COLORS.textPrimary, marginBottom: 8},
  boldText: {fontWeight: '900', color: COLORS.accent},
  subtitle: {fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', maxWidth: 300, lineHeight: 22},
  
  featuresContainer: {width: '100%', gap: SPACING.md, marginVertical: SPACING.xl, paddingHorizontal: SPACING.md},
  featureRow: {flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgElevated, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border},
  iconBg: {width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md, borderWidth: 1, borderColor: COLORS.borderLight},
  featureText: {color: COLORS.textPrimary, fontSize: 16, fontWeight: '600'},

  buttonsContainer: {width: '100%', paddingBottom: 20},
  primaryButton: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    shadowColor: COLORS.accent,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  }
});
