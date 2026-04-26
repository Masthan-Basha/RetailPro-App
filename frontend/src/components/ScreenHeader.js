import React from 'react';
import {View,Text,TouchableOpacity,StyleSheet} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {SPACING,RADIUS} from '../utils/theme';

export default function ScreenHeader({title,subtitle,onBack,action}){
  const {theme} = useTheme();
  return(
    <View style={[styles.header,{backgroundColor:theme.bgSurface,borderBottomColor:theme.border}]}>
      <View style={styles.left}>
        {onBack&&(
          <TouchableOpacity onPress={onBack} style={styles.back}>
            <Text style={[styles.backChev,{color:theme.accent}]}>‹</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={[styles.title,{color:theme.textPrimary}]}>{title}</Text>
          {subtitle&&<Text style={[styles.sub,{color:theme.textMuted}]}>{subtitle}</Text>}
        </View>
      </View>
      {action&&<View style={styles.action}>{action}</View>}
    </View>
  );
}
const styles=StyleSheet.create({
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',
    paddingHorizontal:SPACING.md,paddingVertical:SPACING.md,
    borderBottomWidth:1},
  left:{flexDirection:'row',alignItems:'center',gap:SPACING.sm,flex:1},
  back:{paddingRight:4},
  backChev:{fontSize:30,lineHeight:30,marginTop:-2},
  title:{fontSize:18,fontWeight:'700'},
  sub:{fontSize:11,marginTop:1},
  action:{},
});
