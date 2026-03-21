import { View, Text, StyleSheet, Modal, Pressable } from 'react-native'
import { colors } from '../../../constants/colors'

interface ConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentModal({ visible, onAccept, onDecline }: ConsentModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>🔒 Privacidade e Cookies</Text>
          <Text style={styles.body}>
            Este aplicativo utiliza anúncios personalizados para manter o serviço gratuito.
            {'\n\n'}
            Ao aceitar, você concorda com o uso de cookies e identificadores
            de publicidade conforme nossa Política de Privacidade (LGPD/GDPR).
            {'\n\n'}
            Você pode alterar esta preferência a qualquer momento nas configurações.
          </Text>
          <Pressable style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptText}>Aceitar e Continuar</Text>
          </Pressable>
          <Pressable style={styles.declineButton} onPress={onDecline}>
            <Text style={styles.declineText}>Anúncios não personalizados</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#1A3040',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.blue + '40',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: colors.white + 'CC',
    lineHeight: 22,
    marginBottom: 24,
  },
  acceptButton: {
    backgroundColor: colors.green,
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 12,
  },
  acceptText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  declineButton: {
    paddingVertical: 12,
  },
  declineText: {
    color: colors.white + '80',
    fontSize: 14,
    textAlign: 'center',
  },
})
