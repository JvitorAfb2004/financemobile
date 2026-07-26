import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFinance } from '../../src/hooks/useFinance';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';

export default function LoginEmail() {
  const { user, signInWithEmail } = useFinance();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) router.replace('/(app)/(tabs)');
  }, [user]);

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Preencha todos os campos'); return; }
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email.trim(), password);
    } catch (e: any) {
      console.error('login error:', e?.code, e?.message, e);
      const msg = e?.code?.includes('invalid-credential') ? 'Email ou senha inválidos'
        : e?.code?.includes('invalid-email') ? 'Email inválido'
        : e?.code?.includes('too-many-requests') ? 'Muitas tentativas. Tente mais tarde.'
        : 'Erro ao fazer login. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <LinearGradient colors={['#0ea5e9', '#06b6d4', '#67e8f9']}
        style={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <TouchableOpacity onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 34 }}>
          Entrar para{'\n'}continuar
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: '#f0f9ff', paddingTop: 24, paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 20 }}>Entrar</Text>

          {error ? (
            <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#dc2626', fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <View style={{ marginBottom: 14 }}>
            <TextInput value={email} onChangeText={setEmail} placeholder="Seu email" placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none"
              style={{ height: 52, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: '#1e293b', backgroundColor: '#fff' }} />
          </View>

          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 52, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, backgroundColor: '#fff' }}>
              <TextInput value={password} onChangeText={setPassword} placeholder="Sua senha" placeholderTextColor="#94a3b8" secureTextEntry={!showPassword}
                style={{ flex: 1, fontSize: 15, color: '#1e293b' }} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={handleLogin} disabled={loading}
            style={{ height: 52, borderRadius: 12, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center', marginBottom: 16, opacity: loading ? 0.7 : 1 }}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Entrar</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(public)/forgot-password')} style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#0ea5e9', fontSize: 13, fontWeight: '500' }}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', paddingBottom: 16 }}>
            <Text style={{ color: '#64748b', fontSize: 14 }}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => router.push('/(public)/signup')}>
              <Text style={{ color: '#0ea5e9', fontSize: 14, fontWeight: '600' }}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
