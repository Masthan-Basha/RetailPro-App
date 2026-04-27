import React,{useState} from 'react';
import {View,Text,ScrollView,TouchableOpacity,StyleSheet,KeyboardAvoidingView,Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../context/AuthContext';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import {COLORS,SPACING,RADIUS} from '../../utils/theme';
import {LinearGradient} from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import {useTranslate} from '../../hooks/useTranslate';
export default function LoginScreen({navigation}){
  const {login}=useAuth();
  const {T}=useTranslate();
  const insets=useSafeAreaInsets();
  const [form,setForm]=useState({email:'',password:''});
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  const handle=async()=>{
    if(!form.email||!form.password){setError('Please fill all fields.');return;}
    setError('');setLoading(true);
    try{await login(form.email,form.password);}
    catch(err){setError(err.response?.data?.message||'Login failed.');}
    finally{setLoading(false);}
  };

  return(
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':undefined}>
      <LinearGradient colors={[COLORS.bgBase, '#1e293b', COLORS.bgBase]} style={StyleSheet.absoluteFillObject} />
      <ScrollView style={[styles.container,{paddingTop:insets.top}]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <View style={styles.logoMark}><Text style={styles.logoLetter}>R</Text></View>
          <Text style={styles.logoText}>Retail<Text style={{fontWeight:'800'}}>Pro</Text></Text>
        </View>
        <Text style={styles.title}>{T('welcome_back')}</Text>
        <Text style={styles.subtitle}>{T('enter_cred')}</Text>
        <View style={styles.card}>
          {!!error&&<View style={styles.errBox}><Text style={styles.errText}>{error}</Text></View>}
          <InputField label={T('email_addr')} placeholder="you@shop.com" value={form.email} onChangeText={v=>setForm({...form,email:v})} keyboardType="email-address" autoCapitalize="none"/>
          <InputField label={T('new_pass')} placeholder="Enter password" value={form.password} onChangeText={v=>setForm({...form,password:v})} secureTextEntry/>
          <TouchableOpacity onPress={()=>navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>{T('forgot_pass')}</Text>
          </TouchableOpacity>
          <PrimaryButton title={T('login_btn')} onPress={handle} loading={loading} style={{marginTop:12}}/>
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{T('no_account')} </Text>
          <TouchableOpacity onPress={()=>navigation.navigate('Signup')}>
            <Text style={styles.link}>{T('create_one')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles=StyleSheet.create({
  flex:{flex:1,backgroundColor:COLORS.bgBase},
  container:{flex:1},
  content:{padding:SPACING.lg,minHeight:'100%',justifyContent:'center',maxWidth:450,width:'100%',alignSelf:'center'},
  logoRow:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:SPACING.xl,justifyContent:'center'},
  logoMark:{width:42,height:42,backgroundColor:COLORS.accent,borderRadius:10,alignItems:'center',justifyContent:'center'},
  logoLetter:{color:'#fff',fontSize:22,fontWeight:'800'},
  logoText:{fontSize:22,color:COLORS.textPrimary},
  title:{fontSize:26,fontWeight:'700',color:COLORS.textPrimary,marginBottom:6,textAlign:'center'},
  subtitle:{fontSize:14,color:COLORS.textMuted,marginBottom:SPACING.lg,textAlign:'center'},
  card:{backgroundColor:'rgba(30, 35, 48, 0.7)',borderRadius:RADIUS.xl,padding:SPACING.lg,borderWidth:1,borderColor:'rgba(255,255,255,0.05)',shadowColor:'#000',shadowOffset:{width:0,height:8},shadowOpacity:0.3,shadowRadius:15,elevation:5},
  errBox:{backgroundColor:COLORS.redBg,borderWidth:1,borderColor:COLORS.red+'66',borderRadius:RADIUS.md,padding:12,marginBottom:SPACING.md},
  errText:{color:COLORS.red,fontSize:13},
  forgotBtn:{alignSelf:'flex-end',marginTop:SPACING.xs},
  forgotText:{color:COLORS.accent,fontSize:13,fontWeight:'600'},
  divider:{flexDirection:'row',alignItems:'center',marginVertical:SPACING.lg},
  line:{flex:1,height:1,backgroundColor:'rgba(255,255,255,0.1)'},
  dividerText:{color:COLORS.textMuted,fontSize:12,marginHorizontal:10},
  googleBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,0.05)',borderRadius:RADIUS.md,paddingVertical:12,gap:10,borderWidth:1,borderColor:'rgba(255,255,255,0.1)'},
  googleBtnText:{color:COLORS.textPrimary,fontSize:14,fontWeight:'600'},
  disabledBtn:{opacity:0.5},
  switchRow:{flexDirection:'row',justifyContent:'center',marginTop:SPACING.xl},
  switchText:{color:COLORS.textMuted,fontSize:13},
  link:{color:COLORS.accent,fontSize:13,fontWeight:'700'},
});
