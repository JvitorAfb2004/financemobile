import { View, Text, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface Props {
  selectedMonth: Date;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthNavigator({ selectedMonth, onPrev, onNext }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }}>
      <TouchableOpacity onPress={onPrev} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft size={18} color="#475569" />
      </TouchableOpacity>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>
        {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
      </Text>
      <TouchableOpacity onPress={onNext} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronRight size={18} color="#475569" />
      </TouchableOpacity>
    </View>
  );
}
