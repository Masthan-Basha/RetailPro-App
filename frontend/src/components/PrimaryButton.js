import React from 'react';
import {TouchableOpacity,Text,ActivityIndicator,StyleSheet} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {RADIUS} from '../utils/theme';
export default function PrimaryButton({title,onPress,loading,disabled,color,style}){
  const {theme} = useTheme();
  return(
    <TouchableOpacity style={[styles.btn,{backgroundColor:color||theme.accent},disabled&&styles.disabled,style]} onPress={onPress} disabled={disabled||loading} activeOpacity={0.8}>
      {loading?<ActivityIndicator color="#fff" size="small"/>:<Text style={styles.text}>{title}</Text>}
    </TouchableOpacity>
  );
}
const styles=StyleSheet.create({
  btn:{borderRadius:RADIUS.md,paddingVertical:13,alignItems:'center',justifyContent:'center'},
  text:{color:'#fff',fontSize:15,fontWeight:'700'},
  disabled:{opacity:0.6},
});
