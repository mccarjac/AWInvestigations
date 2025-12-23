import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { colors as themeColors } from '@/styles/theme';
import { DiscordServerConfig } from '@models/types';
import {
  addDiscordServerConfig,
  updateDiscordServerConfig,
  getDiscordServerConfig,
} from '@/utils/discordStorage';
import { testDiscordConnection } from '@/utils/discordApi';

type DiscordServerFormRouteProp = RouteProp<
  RootStackParamList,
  'DiscordServerForm'
>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export const DiscordServerFormScreen: React.FC = () => {
  const route = useRoute<DiscordServerFormRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const serverConfigId = route.params?.serverConfigId;
  const isEditing = !!serverConfigId;

  const [name, setName] = useState('');
  const [botToken, setBotToken] = useState('');
  const [guildId, setGuildId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (isEditing && serverConfigId) {
      loadServerConfig(serverConfigId);
    }
  }, [isEditing, serverConfigId]);

  const loadServerConfig = async (id: string) => {
    setLoading(true);
    try {
      const config = await getDiscordServerConfig(id);
      if (config) {
        setName(config.name);
        setBotToken(config.botToken);
        setGuildId(config.guildId || '');
        setChannelId(config.channelId);
        setEnabled(config.enabled);
      }
    } catch (error) {
      console.error('[Discord Server Form] Error loading config:', error);
      Alert.alert('Error', 'Failed to load server configuration', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!botToken.trim() || !channelId.trim()) {
      Alert.alert('Error', 'Please enter bot token and channel ID', [
        { text: 'OK' },
      ]);
      return;
    }

    setTesting(true);
    try {
      // For testing, we need to temporarily save or test directly
      // For now, we'll test if we're editing an existing config
      if (isEditing && serverConfigId) {
        // Update temporarily to test
        await updateDiscordServerConfig(serverConfigId, {
          botToken: botToken.trim(),
          channelId: channelId.trim(),
          guildId: guildId.trim() || undefined,
        });
        const result = await testDiscordConnection(serverConfigId);
        if (result.success) {
          Alert.alert('Success', 'Connection test successful!', [{ text: 'OK' }]);
        } else {
          Alert.alert('Connection Failed', result.error || 'Unknown error', [
            { text: 'OK' },
          ]);
        }
      } else {
        // For new configs, we can't easily test without saving
        // So we'll do basic validation
        Alert.alert(
          'Info',
          'Connection testing is available after saving. Please save the configuration first.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Connection Failed',
        error instanceof Error ? error.message : 'Unknown error',
        [{ text: 'OK' }]
      );
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for this configuration', [
        { text: 'OK' },
      ]);
      return;
    }
    if (!botToken.trim()) {
      Alert.alert('Error', 'Please enter a bot token', [{ text: 'OK' }]);
      return;
    }
    if (!channelId.trim()) {
      Alert.alert('Error', 'Please enter a channel ID', [{ text: 'OK' }]);
      return;
    }

    setLoading(true);
    try {
      if (isEditing && serverConfigId) {
        await updateDiscordServerConfig(serverConfigId, {
          name: name.trim(),
          botToken: botToken.trim(),
          guildId: guildId.trim() || undefined,
          channelId: channelId.trim(),
          enabled,
        });
        Alert.alert('Success', 'Server configuration updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addDiscordServerConfig({
          name: name.trim(),
          botToken: botToken.trim(),
          guildId: guildId.trim() || undefined,
          channelId: channelId.trim(),
          enabled,
        });
        Alert.alert('Success', 'Server configuration added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('[Discord Server Form] Error saving config:', error);
      Alert.alert(
        'Error',
        `Failed to ${isEditing ? 'update' : 'add'} server configuration`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accent.primary} />
        <Text style={styles.loadingText}>Loading configuration...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>
          {isEditing ? 'Edit Server Configuration' : 'Add Server Configuration'}
        </Text>
        <Text style={styles.description}>
          Configure a Discord server/channel to sync messages from
        </Text>

        <View style={styles.section}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Configuration Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Main RP Server - IC Chat"
              placeholderTextColor={themeColors.text.secondary}
              autoCapitalize="words"
            />
            <Text style={styles.hint}>
              A friendly name to identify this server/channel
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Bot Token <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={botToken}
              onChangeText={setBotToken}
              placeholder="Enter Discord bot token"
              placeholderTextColor={themeColors.text.secondary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              Your Discord bot's authentication token
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Guild/Server ID</Text>
            <TextInput
              style={styles.input}
              value={guildId}
              onChangeText={setGuildId}
              placeholder="Optional: Discord server ID"
              placeholderTextColor={themeColors.text.secondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              Optional: The Discord server (guild) ID
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Channel ID <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={channelId}
              onChangeText={setChannelId}
              placeholder="Enter Discord channel ID"
              placeholderTextColor={themeColors.text.secondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              The Discord channel ID to monitor and sync messages from
            </Text>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.label}>Enable this configuration</Text>
              <Text style={styles.switchHint}>
                Only enabled configurations will be synced
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{
                false: themeColors.border,
                true: themeColors.accent.primary,
              }}
              thumbColor={themeColors.primary}
            />
          </View>
        </View>

        <View style={styles.actions}>
          {isEditing && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.testButton,
                testing && styles.buttonDisabled,
              ]}
              onPress={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator color={themeColors.primary} />
              ) : (
                <Text style={[styles.buttonText, styles.testButtonText]}>
                  Test Connection
                </Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isEditing ? 'Update' : 'Save'} Configuration
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.cancelButtonText]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpHeader}>Setup Instructions:</Text>
          <Text style={styles.helpText}>
            1. Create a Discord bot at discord.com/developers{'\n'}
            2. Copy the bot token and paste it above{'\n'}
            3. Enable developer mode in Discord settings{'\n'}
            4. Right-click your server and copy the Server ID (optional){'\n'}
            5. Right-click the channel and copy the Channel ID{'\n'}
            6. Invite the bot to your server with read permissions{'\n'}
            7. Enable MESSAGE CONTENT INTENT in bot settings{'\n'}
            8. Save and test the connection
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: themeColors.text.secondary,
  },
  content: {
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: themeColors.text.primary,
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  input: {
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: themeColors.text.primary,
  },
  hint: {
    fontSize: 12,
    color: themeColors.text.muted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchHint: {
    fontSize: 12,
    color: themeColors.text.muted,
    marginTop: 2,
  },
  actions: {
    marginBottom: 24,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: themeColors.accent.primary,
  },
  testButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: themeColors.accent.primary,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonText: {
    color: themeColors.accent.primary,
  },
  cancelButtonText: {
    color: themeColors.text.secondary,
  },
  helpSection: {
    padding: 16,
    backgroundColor: themeColors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  helpHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: themeColors.text.secondary,
    lineHeight: 20,
  },
});
