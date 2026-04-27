import React,{useState} from 'react';
import {View,Text,ScrollView,TouchableOpacity,StyleSheet,KeyboardAvoidingView,Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../context/AuthContext';
import {useLanguage} from '../../context/LanguageContext';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import {COLORS,SPACING,RADIUS} from '../../utils/theme';
import {LinearGradient} from 'expo-linear-gradient';
import {useTranslate} from '../../hooks/useTranslate';

export default function SignupScreen({navigation}){
  const {signup}=useAuth();
  const insets=useSafeAreaInsets();
  const {language, changeLanguage} = useLanguage();
  const {T}=useTranslate();
  const [form,setForm]=useState({name:'',shopName:'',email:'',password:'',confirm:''});
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  const handle=async()=>{
    if(!form.name||!form.email||!form.shopName||!form.password){setError('Please fill all fields.');return;}
    if(form.password!==form.confirm){setError('Passwords do not match.');return;}
    
    // Strict Password Validation
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if(!pwdRegex.test(form.password)){
      setError('Password must be at least 8 chars, with uppercase, lowercase, number, and special character.');
      return;
    }
    
    setError('');setLoading(true);
    try{await signup(form.name,form.email,form.password,form.shopName);}
    catch(err){setError(err.response?.data?.message||'Registration failed.');}
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
        <Text style={styles.title}>{T('create_account')}</Text>
        <Text style={styles.subtitle}>{T('join_pro')}</Text>
        
        <View style={{paddingVertical: 10, marginBottom: 15, alignItems: 'center'}}>
          <Text style={{color: COLORS.textMuted, fontSize: 10, marginBottom: 10, fontWeight: '700', letterSpacing: 1}}>{T('onboarding')}</Text>
          <View style={{flexDirection: 'row', gap: 8, justifyContent: 'center'}}>
            {['en','te','hi','ta','kn'].map(code => (
              <TouchableOpacity 
                key={code} 
                onPress={() => changeLanguage(code)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, 
                  backgroundColor: language === code ? COLORS.accent : 'transparent',
                  borderWidth: 1, borderColor: language === code ? COLORS.accent : COLORS.border
                }}
              >
                <Text style={{color: language === code ? '#fff' : COLORS.textSecondary, fontSize: 11, fontWeight: '700'}}>
                  {code.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          {!!error&&<View style={styles.errBox}><Text style={styles.errText}>{error}</Text></View>}
          <InputField label={T('full_name')} placeholder="Ravi Kumar" value={form.name} onChangeText={v=>setForm({...form,name:v})}/>
          <InputField label={T('shop_name')} placeholder="Kumar Hardware" value={form.shopName} onChangeText={v=>setForm({...form,shopName:v})} showTranslate />
          <InputField label={T('email_addr')} placeholder="you@shop.com" value={form.email} onChangeText={v=>setForm({...form,email:v})} keyboardType="email-address" autoCapitalize="none"/>
          <InputField label={T('new_pass')} placeholder="Min 8 chars, 1 Upper, 1 lower, 1 num, 1 spec" value={form.password} onChangeText={v=>setForm({...form,password:v})} secureTextEntry/>
          <InputField label={T('confirm_pass')} placeholder="Re-enter password" value={form.confirm} onChangeText={v=>setForm({...form,confirm:v})} secureTextEntry/>
          <PrimaryButton title={T('create_account')} onPress={handle} loading={loading} color={COLORS.green} style={{marginTop:4}}/>
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{T('already_account')} </Text>
          <TouchableOpacity onPress={()=>navigation.navigate('Login')}>
            <Text style={styles.link}>{T('sign_in')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles=StyleSheet.create({
  flex:{flex:1,backgroundColor:COLORS.bgBase},
  container:{flex:1},
  content:{padding:SPACING.lg,paddingBottom:40,maxWidth:450,width:'100%',alignSelf:'center'},
  logoRow:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:SPACING.xl,marginTop:SPACING.lg,justifyContent:'center'},
  logoMark:{width:42,height:42,backgroundColor:COLORS.accent,borderRadius:10,alignItems:'center',justifyContent:'center'},
  logoLetter:{color:'#fff',fontSize:22,fontWeight:'800'},
  logoText:{fontSize:22,color:COLORS.textPrimary},
  title:{fontSize:26,fontWeight:'700',color:COLORS.textPrimary,marginBottom:6,textAlign:'center'},
  subtitle:{fontSize:14,color:COLORS.textMuted,marginBottom:SPACING.lg,textAlign:'center'},
  card:{backgroundColor:'rgba(30, 35, 48, 0.7)',borderRadius:RADIUS.xl,padding:SPACING.lg,borderWidth:1,borderColor:'rgba(255,255,255,0.05)',shadowColor:'#000',shadowOffset:{width:0,height:8},shadowOpacity:0.3,shadowRadius:15,elevation:5},
  errBox:{backgroundColor:COLORS.redBg,borderWidth:1,borderColor:COLORS.red+'66',borderRadius:RADIUS.md,padding:12,marginBottom:SPACING.md},
  errText:{color:COLORS.red,fontSize:13},
  switchRow:{flexDirection:'row',justifyContent:'center',marginTop:SPACING.lg},
  switchText:{color:COLORS.textMuted,fontSize:13},
  link:{color:COLORS.accent,fontSize:13,fontWeight:'700'},
});
