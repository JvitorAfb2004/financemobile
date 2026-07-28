import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Trash2, CheckCircle, Clock } from 'lucide-react-native';
import type { Transaction } from '../types';

interface Props {
  item: Transaction;
  onEdit: (item: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export default function TransactionSwipeActions({ item, onDelete, onToggleStatus }: Props) {
  const isPaid = item.status === 'PAID';

  const handleToggle = () => {
    onToggleStatus(item.id);
  };

  const handleDelete = () => {
    Alert.alert('Excluir', 'Tem certeza que deseja excluir esta transacao?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => onDelete(item.id) },
    ]);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginLeft: 8 }}>
      <TouchableOpacity onPress={handleToggle}
        style={{ width: 64, height: '100%', backgroundColor: isPaid ? '#f59e0b' : '#22c55e', justifyContent: 'center', alignItems: 'center' }}>
        {isPaid ? <Clock size={20} color="#fff" /> : <CheckCircle size={20} color="#fff" />}
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', marginTop: 2 }}>
          {isPaid ? 'Pendente' : 'Pago'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDelete}
        style={{ width: 64, height: '100%', backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', borderTopRightRadius: 12, borderBottomRightRadius: 12 }}>
        <Trash2 size={20} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', marginTop: 2 }}>Excluir</Text>
      </TouchableOpacity>
    </View>
  );
}
