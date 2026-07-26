import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFinance } from '../../src/hooks/useFinance';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';

export default function ForgotPassword() {
  const { resetPassword } = useFinance();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleReset() {
    if (!email.trim()) { setError('Digite seu email'); return; }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      const msg = e?.code?.includes('user-not-found')
        ? 'Usuário não encontrado'
        : e?.code?.includes('invalid-email')
          ? 'Email inválido'
          : 'Erro ao enviar email. Tente novamente.';
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
          Recuperar{'\n'}senha
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: '#f0f9ff', paddingTop: 24, paddingHorizontal: 24 }}>
          {sent ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <CheckCircle size={32} color="#16a34a" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 8, textAlign: 'center' }}>Email enviado!</Text>
              <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
                Verifique sua caixa de entrada e clique no link para redefinir sua senha.
              </Text>
              <TouchableOpacity onPress={() => router.push('/(public)/login')}
                style={{ height: 52, borderRadius: 12, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Voltar ao Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>Redefinir senha</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Digite seu email e enviaremos um link para redefinir sua senha</Text>

              {error ? (
                <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                  <Text style={{ color: '#dc2626', fontSize: 13 }}>{error}</Text>
                </View>
              ) : null}

              <View style={{ marginBottom: 20 }}>
                <TextInput value={email} onChangeText={setEmail} placeholder="Seu email" placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none"
                  style={{ height: 52, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: '#1e293b', backgroundColor: '#fff' }} />
              </View>

              <TouchableOpacity onPress={handleReset} disabled={loading}
                style={{ height: 52, borderRadius: 12, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center', marginBottom: 16, opacity: loading ? 0.7 : 1 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Enviar link de recuperação</Text>}
              </TouchableOpacity>

              <View style={{ flex: 1 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'center', paddingBottom: 16 }}>
                <Text style={{ color: '#64748b', fontSize: 14 }}>Lembrou a senha? </Text>
                <TouchableOpacity onPress={() => router.push('/(public)/login')}>
                  <Text style={{ color: '#0ea5e9', fontSize: 14, fontWeight: '600' }}>Voltar ao Login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
