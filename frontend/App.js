import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  componentDidCatch(error) {
    this.setState({ error: error.toString() });
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex:1, backgroundColor:'#0d0f14', padding:20, justifyContent:'center' }}>
          <Text style={{ color:'red', fontSize:14 }}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <ErrorBoundary>
              <AppNavigator />
            </ErrorBoundary>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
      {/* Toast must be last child so it renders on top */}
      <Toast />
    </SafeAreaProvider>
  );
}