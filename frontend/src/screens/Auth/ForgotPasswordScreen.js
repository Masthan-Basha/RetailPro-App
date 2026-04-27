import React,{useState} from 'react';
import {View,Text,ScrollView,TouchableOpacity,StyleSheet,KeyboardAvoidingView,Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../context/AuthContext';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import {COLORS,SPACING,RADIUS} from '../../utils/theme';
import {LinearGradient} from 'expo-linear-gradient';
import {useTranslate} from '../../hooks/useTranslate';

export default function ForgotPasswordScreen({navigation}){
  const {forgotPassword}=useAuth();
  const {T}=useTranslate();
  const insets=useSafeAreaInsets();
  const [email,setEmail]=useState('');
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [devData, setDevData]=useState(null);
  const [loading,setLoading]=useState(false);

  const handle=async()=>{
    if(!email){setError('Please enter your email.');return;}
    setError('');setMessage('');setDevData(null);setLoading(true);
    try{
      const res = await forgotPassword(email);
      setMessage(res.message || 'Password reset link has been sent to your email.');
      if(res.devToken || res.devUrl) setDevData(res);
    }
    catch(err){setError(err.response?.data?.message||'Failed to send reset link.');}
    finally{setLoading(false);}
  };

  return(
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':undefined}>
      <LinearGradient colors={[COLORS.bgBase, '#1e293b', COLORS.bgBase]} style={StyleSheet.absoluteFillObject} />
      <ScrollView style={[styles.container,{paddingTop:insets.top}]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.logoText}>{T('forgot_pass')}</Text>
        </View>
        <Text style={styles.title}>{T('recover')}</Text>
        <Text style={styles.subtitle}>{T('enter_email')}</Text>
        <View style={styles.card}>
          {!!error&&<View style={styles.errBox}><Text style={styles.errText}>{error}</Text></View>}
          {!!message&&<View style={styles.successBox}><Text style={styles.successText}>{message}</Text></View>}
          
          <InputField label={T('email_addr')} placeholder="you@shop.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
          <PrimaryButton title={T('reset_link')} onPress={handle} loading={loading} style={{marginTop:4}}/>

          {devData && (
            <TouchableOpacity 
              style={[styles.successBox, {marginTop: 15, backgroundColor: COLORS.accent+'22', borderColor: COLORS.accent+'66'}]}
              onPress={() => navigation.navigate('ResetPassword', { token: devData.devToken })}
            >
              <Text style={[styles.successText, {color: COLORS.accent, textAlign: 'center'}]}>
                🛠️ DEV: Click here to Reset Now
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles=StyleSheet.create({
  flex:{flex:1,backgroundColor:COLORS.bgBase},
  container:{flex:1},
  content:{padding:SPACING.lg,minHeight:'100%',justifyContent:'center',maxWidth:450,width:'100%',alignSelf:'center'},
  logoRow:{flexDirection:'row',alignItems:'center',gap:15,marginBottom:SPACING.xl},
  backBtn:{width:40,height:40,borderRadius:20,backgroundColor:'rgba(255,255,255,0.05)',alignItems:'center',justifyContent:'center'},
  backBtnText:{color:COLORS.textPrimary,fontSize:20},
  logoText:{fontSize:22,color:COLORS.textPrimary},
  title:{fontSize:26,fontWeight:'700',color:COLORS.textPrimary,marginBottom:6,textAlign:'center'},
  subtitle:{fontSize:14,color:COLORS.textMuted,marginBottom:SPACING.lg,textAlign:'center'},
  card:{backgroundColor:'rgba(30, 35, 48, 0.7)',borderRadius:RADIUS.xl,padding:SPACING.lg,borderWidth:1,borderColor:'rgba(255,255,255,0.05)',shadowColor:'#000',shadowOffset:{width:0,height:8},shadowOpacity:0.3,shadowRadius:15,elevation:5},
  errBox:{backgroundColor:COLORS.redBg,borderWidth:1,borderColor:COLORS.red+'66',borderRadius:RADIUS.md,padding:12,marginBottom:SPACING.md},
  errText:{color:COLORS.red,fontSize:13},
  successBox:{backgroundColor:'rgba(16, 185, 129, 0.1)',borderWidth:1,borderColor:'rgba(16, 185, 129, 0.4)',borderRadius:RADIUS.md,padding:12,marginBottom:SPACING.md},
  successText:{color:'#10b981',fontSize:13},
});
