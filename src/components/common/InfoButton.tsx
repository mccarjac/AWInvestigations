import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  Modal,
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';

interface InfoButtonProps {
  title: string;
  content: string;
  iconSize?: number;
}

export const InfoButton: React.FC<InfoButtonProps> = ({
  title,
  content,
  iconSize = 18,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.infoButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.infoIcon, { fontSize: iconSize }]}>ⓘ</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalText}>{content}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  infoButton: {
    padding: 4,
    marginLeft: 8,
  },
  infoIcon: {
    color: themeColors.accent.info,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: themeColors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  modalTitle: {
    ...commonStyles.text.h2,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalText: {
    ...commonStyles.text.body,
    lineHeight: 24,
    color: themeColors.text.primary,
  },
  closeButton: {
    ...commonStyles.button.primary,
    marginTop: 20,
    paddingVertical: 12,
  },
  closeButtonText: {
    color: themeColors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
