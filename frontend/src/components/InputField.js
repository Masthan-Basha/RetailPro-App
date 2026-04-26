import React from 'react';
import {View,Text,TextInput,StyleSheet} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {RADIUS,SPACING} from '../utils/theme';
export default function InputField({label,error,...props}){
  const {theme} = useTheme();
  return(
    <View style={styles.wrap}>
      {label&&<Text style={[styles.label,{color:theme.textSecondary}]}>{label}</Text>}
      <TextInput style={[styles.input,{backgroundColor:theme.bgElevated,borderColor:error?theme.red:theme.borderLight,color:theme.textPrimary}]} placeholderTextColor={theme.textMuted} {...props}/>
      {error&&<Text style={[styles.errText,{color:theme.red}]}>{error}</Text>}
    </View>
  );
}
const styles=StyleSheet.create({
  wrap:{marginBottom:SPACING.md},
  label:{fontSize:12,fontWeight:'600',marginBottom:6},
  input:{borderWidth:1,borderRadius:RADIUS.md,paddingHorizontal:SPACING.md,paddingVertical:12,fontSize:14},
  errText:{fontSize:11,marginTop:4},
});
