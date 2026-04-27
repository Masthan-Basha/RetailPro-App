import React, { useState } from 'react';
import {View,Text,TextInput,StyleSheet,TouchableOpacity,ActivityIndicator,Alert} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {RADIUS,SPACING, COLORS} from '../utils/theme';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../utils/TranslationService';

export default function InputField({label,error,showTranslate,onTranslated,value,onChangeText,secureTextEntry,...props}){
  const {theme} = useTheme();
  const {language, languages} = useLanguage();
  const [translating, setTranslating] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const currentLangName = languages.find(l => l.code === language)?.name || 'local';

  const handleTranslate = async () => {
    if (!value) return;
    if (language === 'en') {
      Alert.alert('Info', 'Please select a local language (like Telugu or Hindi) at the top first.');
      return;
    }
    
    setTranslating(true);
    try {
      const result = await translateText(value, language);
      if (onTranslated) onTranslated(result);
      else if (onChangeText) onChangeText(result);
    } catch (err) {
      Alert.alert('Error', 'Translation failed. check connection.');
    } finally {
      setTranslating(false);
    }
  };

  return(
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        {label&&<Text style={[styles.label,{color:theme.textSecondary}]}>{label}</Text>}
        {showTranslate && value && (
          <TouchableOpacity onPress={handleTranslate} style={styles.translateBtn} disabled={translating}>
            {translating ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Text style={[styles.translateText, {color: theme.accent}]}>Translate to {currentLangName}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.inputContainer}>
        <TextInput 
          style={[styles.input,{backgroundColor:theme.bgElevated,borderColor:error?theme.red:theme.borderLight,color:theme.textPrimary}]} 
          placeholderTextColor={theme.textMuted} 
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Feather name={isPasswordVisible ? "eye-off" : "eye"} size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error&&<Text style={[styles.errText,{color:theme.red}]}>{error}</Text>}
    </View>
  );
}
const styles=StyleSheet.create({
  wrap:{marginBottom:SPACING.md},
  labelRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:6},
  label:{fontSize:12,fontWeight:'600'},
  translateBtn:{paddingHorizontal:8,paddingVertical:2},
  translateText:{fontSize:11,fontWeight:'700'},
  inputContainer:{position:'relative',justifyContent:'center'},
  input:{borderWidth:1,borderRadius:RADIUS.md,paddingHorizontal:SPACING.md,paddingVertical:12,fontSize:14,paddingRight:45},
  eyeIcon:{position:'absolute',right:12,padding:4},
  errText:{fontSize:11,marginTop:4},
});
