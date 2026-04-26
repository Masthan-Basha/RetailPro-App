import React from 'react';
import {View,Text,StyleSheet} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {RADIUS} from '../utils/theme';
import {badgeColor,badgeBg} from '../utils/format';
export default function Badge({status,label}){
  const {theme} = useTheme();
  const col=badgeColor(status,theme);
  const bg =badgeBg(status,theme);
  return(
    <View style={[styles.badge,{backgroundColor:bg}]}>
      <Text style={[styles.text,{color:col}]}>{label||status}</Text>
    </View>
  );
}
const styles=StyleSheet.create({
  badge:{paddingHorizontal:10,paddingVertical:3,borderRadius:RADIUS.full,alignSelf:'flex-start'},
  text:{fontSize:11,fontWeight:'700',textTransform:'capitalize'},
});
