import React,{createContext,useContext,useState,useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { authAPI } from '../utils/api';

const AuthContext = createContext(null);
const SESSION_KEY='retailpro_user', TOKEN_KEY='retailpro_token';

export function AuthProvider({children}){
  const [user,setUser]     = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if(raw){ 
           const p=JSON.parse(raw); 
           setUser(p); 
        }
      }catch{}
      setLoading(false);
    })();
  },[]);

  const _save = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem(SESSION_KEY,JSON.stringify(userData));
    await AsyncStorage.setItem(TOKEN_KEY,userData.token);
  };

  const login = async (email,password) => {
    const res=await authAPI.login({email,password});
    await _save(res.data); 
    return res.data;
  };

  const signup = async (name,email,password,shopName) => {
    const res=await authAPI.register({name,email,password,shopName});
    await _save(res.data); 
    return res.data;
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.multiRemove([SESSION_KEY,TOKEN_KEY]);
  };

  const forgotPassword = async (email) => {
    const res = await authAPI.forgotPassword(email);
    return res.data;
  };

  const resetPassword = async (token, password) => {
    const res = await authAPI.resetPassword(token, password);
    return res.data;
  };

  const googleLogin = async (idToken) => {
    const res = await authAPI.googleLogin(idToken);
    await _save(res.data);
    return res.data;
  };

  return <AuthContext.Provider value={{user,loading,login,signup,logout,forgotPassword,resetPassword,googleLogin}}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
