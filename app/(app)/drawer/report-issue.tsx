import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function ReportIssue() {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    setSent(true);
    setMessage('');
    Alert.alert('Obrigado!', 'Sua mensagem foi enviada.');
  };

  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 8, textAlign: 'center' }}>Mensagem enviada com sucesso!</Text>
        <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 16 }}>Entraremos em contato em breve.</Text>
        <TouchableOpacity onPress={() => setSent(false)}
          style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, backgroundColor: '#3b82f6' }}>
          <Text style={{ fontWeight: '600', color: '#fff' }}>Enviar outra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 16 }}>
      <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Descreva o problema ou sugestão:</Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={6}
        style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 14, color: '#1e293b', minHeight: 140, textAlignVertical: 'top', marginBottom: 16 }}
        placeholder="Descreva o problema..."
      />
      <TouchableOpacity onPress={handleSend}
        style={{ paddingVertical: 14, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center' }}>
        <Text style={{ fontWeight: '600', color: '#fff', fontSize: 15 }}>Enviar</Text>
      </TouchableOpacity>
    </View>
  );
}
