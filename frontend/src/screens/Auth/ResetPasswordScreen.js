import React,{useState} from 'react';
import {View,Text,ScrollView,TouchableOpacity,StyleSheet,KeyboardAvoidingView,Platform,Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../context/AuthContext';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import {COLORS,SPACING,RADIUS} from '../../utils/theme';
import {LinearGradient} from 'expo-linear-gradient';
import {useTranslate} from '../../hooks/useTranslate';

export default function ResetPasswordScreen({route,navigation}){
  const {resetPassword}=useAuth();
  const {T}=useTranslate();
  const insets=useSafeAreaInsets();
  const token = route.params?.token;
  const [password,setPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading] = useState(false);

  const handle=async()=>{
    if(!password||!confirmPassword){setError('Please fill all fields.');return;}
    if(password!==confirmPassword){setError('Passwords do not match.');return;}
    if(!token){setError('Invalid session. Please request a new reset link.');return;}
    
    setError('');setLoading(true);
    try{
      await resetPassword(token, password);
      Alert.alert("Success", "Password updated successfully!", [
        { text: "Login Now", onPress: () => navigation.navigate('Login') }
      ]);
    }
    catch(err){setError(err.response?.data?.message||'Failed to reset password.');}
    finally{setLoading(false);}
  };

  return(
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':undefined}>
      <LinearGradient colors={[COLORS.bgBase, '#1e293b', COLORS.bgBase]} style={StyleSheet.absoluteFillObject} />
      <ScrollView style={[styles.container,{paddingTop:insets.top}]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>{T('update_pass')}</Text>
        </View>
        <Text style={styles.title}>{T('update_pass')}</Text>
        <Text style={styles.subtitle}>{T('new_pass')}</Text>
        <View style={styles.card}>
          {!!error&&<View style={styles.errBox}><Text style={styles.errText}>{error}</Text></View>}
          <InputField label={T('new_pass')} placeholder="Enter new password" value={password} onChangeText={setPassword} secureTextEntry/>
          <InputField label={T('confirm_pass')} placeholder="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry/>
          <PrimaryButton title={T('update_pass')} onPress={handle} loading={loading} style={{marginTop:4}}/>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles=StyleSheet.create({
  flex:{flex:1,backgroundColor:COLORS.bgBase},
  container:{flex:1},
  content:{padding:SPACING.lg,minHeight:'100%',justifyContent:'center',maxWidth:450,width:'100%',alignSelf:'center'},
  logoRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',marginBottom:SPACING.xl},
  logoText:{fontSize:22,color:COLORS.textPrimary},
  title:{fontSize:26,fontWeight:'700',color:COLORS.textPrimary,marginBottom:6,textAlign:'center'},
  subtitle:{fontSize:14,color:COLORS.textMuted,marginBottom:SPACING.lg,textAlign:'center'},
  card:{backgroundColor:'rgba(30, 35, 48, 0.7)',borderRadius:RADIUS.xl,padding:SPACING.lg,borderWidth:1,borderColor:'rgba(255,255,255,0.05)',shadowColor:'#000',shadowOffset:{width:0,height:8},shadowOpacity:0.3,shadowRadius:15,elevation:5},
  errBox:{backgroundColor:COLORS.redBg,borderWidth:1,borderColor:COLORS.red+'66',borderRadius:RADIUS.md,padding:12,marginBottom:SPACING.md},
  errText:{color:COLORS.red,fontSize:13},
});
