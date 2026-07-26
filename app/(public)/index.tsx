import { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../src/hooks/useFinance';

const { width } = Dimensions.get('window');

export default function Welcome() {
  const { user, loading } = useFinance();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/(app)/(tabs)');
  }, [user, loading]);

  if (loading) return null;
  if (user) return null;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <LinearGradient colors={['#0ea5e9', '#06b6d4', '#67e8f9']} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40, paddingBottom: 20 }}>
            <View style={{ width: 100, height: 100, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
              <Ionicons name="wallet" size={56} color="#fff" />
            </View>

            <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 12 }}>
              Bem-vindo ao{'\n'}
              <Text style={{ color: '#fef08a' }}>Genius Finance</Text>
            </Text>
            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', paddingHorizontal: 40, lineHeight: 24 }}>
              Gerencie suas finanças de forma{'\n'}simples e segura
            </Text>
          </View>

          <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
            <TouchableOpacity onPress={() => router.push('/(public)/login')}
              style={{ height: 56, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}>
              <Text style={{ color: '#0ea5e9', fontSize: 17, fontWeight: '700' }}>Começar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(public)/signup')}
              style={{ height: 56, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Criar conta grátis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
