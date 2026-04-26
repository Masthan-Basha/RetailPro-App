import React from 'react';
import {View,Text,ActivityIndicator} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useAuth} from '../context/AuthContext';
import {ThemeProvider,useTheme} from '../context/ThemeContext';
import { Feather } from '@expo/vector-icons';

import LoginScreen          from '../screens/Auth/LoginScreen';
import SignupScreen         from '../screens/Auth/SignupScreen';
import WelcomeScreen        from '../screens/Auth/WelcomeScreen';
import HomeScreen           from '../screens/Home/HomeScreen';
import InvoiceListScreen    from '../screens/Invoice/InvoiceListScreen';
import CreateInvoiceScreen  from '../screens/Invoice/CreateInvoiceScreen';
import InvoiceDetailScreen  from '../screens/Invoice/InvoiceDetailScreen';
import InventoryScreen      from '../screens/Inventory/InventoryScreen';
import CustomersScreen      from '../screens/Customers/CustomersScreen';
import DealersScreen        from '../screens/Dealers/DealersScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function TabIcon({name,focused}){
  const {theme} = useTheme();
  return <Feather name={name} size={22} color={focused ? theme.accent : theme.textMuted} />;
}

function InvoiceStack(){
  return(
    <Stack.Navigator screenOptions={{headerShown:false}}>
      <Stack.Screen name="InvoiceList"   component={InvoiceListScreen}/>
      <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen}/>
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen}/>
    </Stack.Navigator>
  );
}

function MainTabsInner(){
  const {theme} = useTheme();
  return(
    <Tab.Navigator screenOptions={{
      headerShown:false,
      tabBarStyle:{backgroundColor:theme.bgSurface,borderTopColor:theme.border,borderTopWidth:1,height:60,paddingBottom:8,paddingTop:6},
      tabBarActiveTintColor:theme.accent,
      tabBarInactiveTintColor:theme.textMuted,
      tabBarLabelStyle:{fontSize:10,fontWeight:'600'},
    }}>
      <Tab.Screen name="Home"       component={HomeScreen}       options={{tabBarIcon:({focused})=><TabIcon name="home" focused={focused}/>}}/>
      <Tab.Screen name="Invoices"   component={InvoiceStack}     options={{tabBarIcon:({focused})=><TabIcon name="file-text" focused={focused}/>}}/>
      <Tab.Screen name="Inventory"  component={InventoryScreen}  options={{tabBarIcon:({focused})=><TabIcon name="box" focused={focused}/>}}/>
      <Tab.Screen name="Customers"  component={CustomersScreen}  options={{tabBarIcon:({focused})=><TabIcon name="users" focused={focused}/>}}/>
      <Tab.Screen name="Dealers"    component={DealersScreen}    options={{tabBarIcon:({focused})=><TabIcon name="truck" focused={focused}/>}}/>
    </Tab.Navigator>
  );
}

function AuthStack(){
  return(
    <Stack.Navigator screenOptions={{headerShown:false}} initialRouteName="Welcome">
      <Stack.Screen name="Welcome" component={WelcomeScreen}/>
      <Stack.Screen name="Login"  component={LoginScreen}/>
      <Stack.Screen name="Signup" component={SignupScreen}/>
    </Stack.Navigator>
  );
}

function AppContent(){
  const {user,loading}=useAuth();
  const {theme} = useTheme();
  if(loading) return(
    <View style={{flex:1,backgroundColor:theme.bgBase,alignItems:'center',justifyContent:'center'}}>
      <ActivityIndicator color={theme.accent} size="large"/>
    </View>
  );
  return(
    <NavigationContainer>
      {user?<MainTabsInner/>:<AuthStack/>}
    </NavigationContainer>
  );
}

export default function AppNavigator(){
  return(
    <ThemeProvider>
      <AppContent/>
    </ThemeProvider>
  );
}
