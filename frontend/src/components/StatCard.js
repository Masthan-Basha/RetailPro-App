import React from 'react';
import {View,Text,StyleSheet} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {RADIUS,SPACING,SHADOW} from '../utils/theme';
import { Feather } from '@expo/vector-icons';

export default function StatCard({label,value,sub,iconName,color}){
  const {theme} = useTheme();
  const c=color||theme.accent;
  return(
    <View style={[styles.card,{backgroundColor:theme.bgCard,borderColor:theme.border},SHADOW.card]}>
      <View style={[styles.iconBox,{backgroundColor:c+'22'}]}>
        <Feather name={iconName||'activity'} size={18} color={c}/>
      </View>
      <Text style={[styles.value,{color:c}]}>{value}</Text>
      <Text style={[styles.label,{color:theme.textSecondary}]}>{label}</Text>
      {sub?<Text style={[styles.sub,{color:theme.textMuted}]}>{sub}</Text>:null}
    </View>
  );
}
const styles=StyleSheet.create({
  card:{flex:1,borderRadius:RADIUS.lg,padding:SPACING.md,borderWidth:1},
  iconBox:{width:36,height:36,borderRadius:RADIUS.md,alignItems:'center',justifyContent:'center',marginBottom:SPACING.sm},
  value:{fontSize:20,fontWeight:'700',marginBottom:2},
  label:{fontSize:12},
  sub:{fontSize:11,marginTop:2},
});
