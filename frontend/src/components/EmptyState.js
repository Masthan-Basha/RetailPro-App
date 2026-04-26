import React from 'react';
import {View,Text,StyleSheet} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {SPACING} from '../utils/theme';
export default function EmptyState({icon='📭',title,subtitle}){
  const {theme} = useTheme();
  return(
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title,{color:theme.textSecondary}]}>{title}</Text>
      {subtitle&&<Text style={[styles.sub,{color:theme.textMuted}]}>{subtitle}</Text>}
    </View>
  );
}
const styles=StyleSheet.create({
  wrap:{flex:1,alignItems:'center',justifyContent:'center',padding:SPACING.xl,gap:8},
  icon:{fontSize:40,marginBottom:SPACING.sm},
  title:{fontSize:15,fontWeight:'600',textAlign:'center'},
  sub:{fontSize:13,textAlign:'center'},
});
