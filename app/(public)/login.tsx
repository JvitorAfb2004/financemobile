import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useFinance } from '../../src/hooks/useFinance';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function Login() {
  const { user, loading, signInWithGoogle, signInWithEmail } = useFinance();
  const router = useRouter();
  const [mode, setMode] = useState<'choose' | 'email'>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace('/(app)/(tabs)');
  }, [user]);

  const handleEmailLogin = async () => {
    if (!email || !password) { setError('Preencha todos os campos'); return; }
    setError('');
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
    } catch (e: any) {
      console.error('login error:', e?.code, e?.message, e);
      const msg = e?.code?.includes('invalid-credential') ? 'Email ou senha inválidos'
        : e?.code?.includes('invalid-email') ? 'Email inválido'
        : e?.code?.includes('too-many-requests') ? 'Muitas tentativas. Tente mais tarde.'
        : 'Erro ao fazer login. Tente novamente.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </SafeAreaView>
    );
  }

  if (user) return null;

  if (mode === 'email') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <LinearGradient colors={['#0ea5e9', '#06b6d4', '#67e8f9']}
          style={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <TouchableOpacity onPress={() => { setMode('choose'); setError(''); setEmail(''); setPassword(''); }}
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

            <TouchableOpacity onPress={handleEmailLogin} disabled={submitting}
              style={{ height: 52, borderRadius: 12, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center', marginBottom: 16, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Entrar</Text>}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
              <Text style={{ marginHorizontal: 14, color: '#94a3b8', fontSize: 12 }}>ou continue com</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <TouchableOpacity onPress={() => signInWithGoogle()}
                style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#4285f4' }}>G</Text>
                <Text style={{ color: '#1e293b', fontSize: 14, fontWeight: '500' }}>Google</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity onPress={() => router.push('/(public)/forgot-password')} style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#0ea5e9', fontSize: 13, fontWeight: '500' }}>Esqueceu a senha?</Text>
            </TouchableOpacity>

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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <LinearGradient colors={['#0ea5e9', '#06b6d4', '#67e8f9']}
        style={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.replace('/(public)')}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(public)/signup')}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>Criar conta</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 34 }}>
          Entrar para{'\n'}continuar
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#f0f9ff', paddingTop: 24, paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 20 }}>Entrar</Text>

          <TouchableOpacity onPress={() => signInWithGoogle()}
            style={{ height: 52, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#4285f4' }}>G</Text>
            <Text style={{ color: '#1e293b', fontSize: 15, fontWeight: '500' }}>Entrar com Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode('email')}
            style={{ height: 52, borderRadius: 12, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Entrar com Email</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
            <Text style={{ marginHorizontal: 14, color: '#94a3b8', fontSize: 12 }}>ou continue com</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
          </View>

          <View style={{ flex: 1 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', paddingBottom: 16 }}>
            <Text style={{ color: '#64748b', fontSize: 14 }}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => router.push('/(public)/signup')}>
              <Text style={{ color: '#0ea5e9', fontSize: 14, fontWeight: '600' }}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
