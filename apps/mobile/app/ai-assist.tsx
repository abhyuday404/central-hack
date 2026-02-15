import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useDevWalletContext } from "@/lib/wallet";
import {
  getMedicalRecordContractWithSigner,
  safeContractCall,
  type RecordItem,
} from "@/lib/medicalRecord";
import { loadProfile, type UserProfile } from "@/lib/profile-storage";

const backendUrl =
  process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

const AI_FETCH_TIMEOUT_MS = 65_000;

type ChatMessage = {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
};

type QuickAction = {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  color: string;
  bgColor: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "summary",
    label: "Health Summary",
    icon: "heart.text.clipboard",
    prompt:
      "Give me a comprehensive summary of my overall health based on my profile and medical records. Include any areas of concern and positive aspects.",
    color: "#E53935",
    bgColor: "#FEF2F2",
  },
  {
    id: "medications",
    label: "Allergy Insights",
    icon: "exclamationmark.triangle.fill",
    prompt:
      "Based on my allergies and medical conditions, what should I be careful about in daily life? Any foods, medications, or situations to avoid?",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
  },
  {
    id: "immunization",
    label: "Immunization Check",
    icon: "syringe.fill",
    prompt:
      "Review my immunization records. Are there any vaccines I'm due for, overdue on, or should consider getting? What's recommended for someone my age?",
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
  },
  {
    id: "records",
    label: "Records Overview",
    icon: "doc.text.fill",
    prompt:
      "Look at my medical records and give me an overview. What types of records do I have? When was my last upload? Are there any gaps in my documentation I should fill?",
    color: "#0EA5E9",
    bgColor: "#F0F9FF",
  },
  {
    id: "questions",
    label: "Doctor Questions",
    icon: "stethoscope",
    prompt:
      "Based on my health profile and conditions, suggest important questions I should ask my doctor at my next visit.",
    color: "#22C55E",
    bgColor: "#F0FDF4",
  },
  {
    id: "emergency",
    label: "Emergency Info",
    icon: "staroflife.fill",
    prompt:
      "Summarize my critical health information that would be important in an emergency — blood type, allergies, conditions, emergency contact, and any other vital details.",
    color: "#EF4444",
    bgColor: "#FEF2F2",
  },
];

export default function AIAssistScreen() {
  const router = useRouter();
  const { address, signer } = useDevWalletContext();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [, setError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  // Load patient context on focus
  const loadContext = useCallback(async () => {
    setIsLoadingContext(true);
    try {
      const profileData = await loadProfile();
      setProfile(profileData);
    } catch {
      // use defaults
    }

    if (signer && address) {
      try {
        const contract = getMedicalRecordContractWithSigner(signer);
        const data = (await safeContractCall(signer, () =>
          contract.getRecords(address),
        )) as RecordItem[];
        setRecords(data);
      } catch {
        // silently continue without records
      }
    }
    setIsLoadingContext(false);
  }, [signer, address]);

  useFocusEffect(
    useCallback(() => {
      loadContext();
    }, [loadContext]),
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const buildConversationHistory = useCallback(() => {
    // Skip the initial system messages, send only user/model pairs
    return messages.map((msg) => ({
      role: msg.role,
      text: msg.text,
    }));
  }, [messages]);

  const serializeRecords = useCallback(() => {
    return records.map((r) => ({
      fileName: r.fileName,
      doctor: r.doctor,
      ipfsHash: r.ipfsHash,
      timestamp: r.timestamp ? r.timestamp.toString() : "0",
    }));
  }, [records]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText("");
      setIsLoading(true);
      setError(null);

      Keyboard.dismiss();

      try {
        const conversationHistory = buildConversationHistory();

        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          AI_FETCH_TIMEOUT_MS,
        );

        console.log(
          "[AI Assist] Sending request to",
          `${backendUrl}/ai-assist`,
        );

        let response: Response;
        try {
          response = await fetch(`${backendUrl}/ai-assist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              message: text.trim(),
              profile: profile
                ? {
                    fullName: profile.fullName,
                    age: profile.age,
                    gender: profile.gender,
                    bloodGroup: profile.bloodGroup,
                    weight: profile.weight,
                    height: profile.height,
                    allergies: profile.allergies,
                    conditions: profile.conditions,
                    insuranceStatus: profile.insuranceStatus,
                    insuranceProvider: profile.insuranceProvider,
                    emergencyContactName: profile.emergencyContactName,
                    emergencyContactRelation: profile.emergencyContactRelation,
                    emergencyContactPhone: profile.emergencyContactPhone,
                    immunizations: profile.immunizations,
                  }
                : null,
              records: serializeRecords(),
              conversationHistory,
            }),
          });
        } catch (fetchErr: any) {
          clearTimeout(timeout);
          console.error(
            "[AI Assist] Fetch failed:",
            fetchErr?.name,
            fetchErr?.message,
          );
          if (fetchErr?.name === "AbortError") {
            throw new Error(
              "Request timed out — the AI took too long to respond. Try a shorter question.",
            );
          }
          throw new Error(
            `Network error: could not reach the server at ${backendUrl}. Make sure the backend is running.`,
          );
        }
        clearTimeout(timeout);

        console.log("[AI Assist] Response status:", response.status);

        let data: any;
        try {
          data = await response.json();
        } catch {
          console.error(
            "[AI Assist] Failed to parse response JSON, status:",
            response.status,
          );
          throw new Error(
            `Server returned status ${response.status} with non-JSON body.`,
          );
        }

        if (!response.ok) {
          console.error(
            "[AI Assist] Server error:",
            response.status,
            data?.error,
          );
          throw new Error(data.error || `Server error (${response.status})`);
        }

        const aiMessage: ChatMessage = {
          id: `model-${Date.now()}`,
          role: "model",
          text: data.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Something went wrong";
        console.error("[AI Assist] Error:", errorMsg);
        setError(errorMsg);

        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "model",
          text: `⚠️ ${errorMsg}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, profile, serializeRecords, buildConversationHistory],
  );

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      sendMessage(action.prompt);
    },
    [sendMessage],
  );

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const formatMessageText = (text: string) => {
    // Simple markdown-like formatting
    const lines = text.split("\n");
    return lines.map((line, index) => {
      const trimmed = line.trim();

      // Bold headers (lines starting with **)
      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        return (
          <Text key={index} style={styles.messageBold}>
            {trimmed.replace(/\*\*/g, "")}
            {"\n"}
          </Text>
        );
      }

      // Bullet points
      if (
        trimmed.startsWith("- ") ||
        trimmed.startsWith("• ") ||
        trimmed.startsWith("* ")
      ) {
        return (
          <Text key={index} style={styles.messageBullet}>
            {"  •  "}
            {formatInlineBold(trimmed.slice(2))}
            {"\n"}
          </Text>
        );
      }

      // Numbered list
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <Text key={index} style={styles.messageBullet}>
            {"  "}
            {formatInlineBold(trimmed)}
            {"\n"}
          </Text>
        );
      }

      // Empty line
      if (trimmed === "") {
        return <Text key={index}>{"\n"}</Text>;
      }

      // Regular text with inline bold
      return (
        <Text key={index}>
          {formatInlineBold(trimmed)}
          {"\n"}
        </Text>
      );
    });
  };

  const formatInlineBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <Text key={i} style={{ fontWeight: "700" }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return part;
    });
  };

  const hasMessages = messages.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5F0" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={20} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerAiBadge}>
              <IconSymbol name="sparkles" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Health AI</Text>
          </View>
          {hasMessages ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearChat}
            >
              <IconSymbol name="trash" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {/* Context Loading Banner */}
        {isLoadingContext && (
          <View style={styles.contextBanner}>
            <ActivityIndicator size="small" color="#6B7280" />
            <Text style={styles.contextBannerText}>
              Loading your health data...
            </Text>
          </View>
        )}

        {/* Context Ready Banner */}
        {!isLoadingContext && !hasMessages && (
          <View style={styles.contextReadyBanner}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={14}
              color="#22C55E"
            />
            <Text style={styles.contextReadyText}>
              {records.length} record{records.length !== 1 ? "s" : ""} & profile
              loaded
            </Text>
          </View>
        )}

        {/* Main Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            !hasMessages && styles.scrollContentCentered,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!hasMessages ? (
            /* Welcome / Quick Actions View */
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIconWrap}>
                <IconSymbol name="sparkles" size={36} color="#E53935" />
              </View>
              <Text style={styles.welcomeTitle}>
                Hi
                {profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""}
                ! 👋
              </Text>
              <Text style={styles.welcomeSubtext}>
                I can help you understand your health records, answer medical
                questions, and provide personalized health insights.
              </Text>

              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                {QUICK_ACTIONS.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.quickActionCard,
                      { backgroundColor: action.bgColor },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleQuickAction(action)}
                    disabled={isLoading}
                  >
                    <View
                      style={[
                        styles.quickActionIcon,
                        { backgroundColor: action.color + "20" },
                      ]}
                    >
                      <IconSymbol
                        name={action.icon}
                        size={18}
                        color={action.color}
                      />
                    </View>
                    <Text
                      style={[styles.quickActionLabel, { color: action.color }]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.disclaimerCard}>
                <IconSymbol name="info.circle.fill" size={16} color="#6B7280" />
                <Text style={styles.disclaimerText}>
                  AI responses are for informational purposes only and should
                  not replace professional medical advice, diagnosis, or
                  treatment.
                </Text>
              </View>
            </View>
          ) : (
            /* Chat Messages */
            <View style={styles.messagesContainer}>
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.role === "user" ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  {msg.role === "model" && (
                    <View style={styles.aiBubbleHeader}>
                      <View style={styles.aiBubbleIcon}>
                        <IconSymbol name="sparkles" size={12} color="#E53935" />
                      </View>
                      <Text style={styles.aiBubbleLabel}>Health AI</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      msg.role === "user"
                        ? styles.userMessageText
                        : styles.aiMessageText,
                    ]}
                  >
                    {msg.role === "model"
                      ? formatMessageText(msg.text)
                      : msg.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      msg.role === "user"
                        ? styles.userMessageTime
                        : styles.aiMessageTime,
                    ]}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  <View style={styles.aiBubbleHeader}>
                    <View style={styles.aiBubbleIcon}>
                      <IconSymbol name="sparkles" size={12} color="#E53935" />
                    </View>
                    <Text style={styles.aiBubbleLabel}>Health AI</Text>
                  </View>
                  <View style={styles.typingIndicator}>
                    <View style={[styles.typingDot, styles.typingDot1]} />
                    <View style={[styles.typingDot, styles.typingDot2]} />
                    <View style={[styles.typingDot, styles.typingDot3]} />
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask about your health..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              editable={!isLoading}
              onFocus={scrollToBottom}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <IconSymbol name="arrow.up" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F5F0",
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E4DC",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerAiBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerSpacer: {
    width: 40,
  },

  // Context banners
  contextBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    backgroundColor: "#FFF9E6",
    borderBottomWidth: 1,
    borderBottomColor: "#F5E6A3",
  },
  contextBannerText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#92400E",
  },
  contextReadyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: "#D1FAE5",
  },
  contextReadyText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#166534",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: "center",
  },

  // Welcome
  welcomeContainer: {
    alignItems: "center",
    paddingTop: 20,
  },
  welcomeIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSubtext: {
    fontSize: 15,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 28,
  },

  // Quick Actions
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    width: "100%",
    marginBottom: 20,
  },
  quickActionCard: {
    width: "48%",
    flexGrow: 1,
    flexBasis: "46%",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Disclaimer
  disclaimerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "400",
    color: "#6B7280",
    lineHeight: 18,
  },

  // Messages
  messagesContainer: {
    gap: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: 20,
    padding: 14,
    paddingHorizontal: 16,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#E53935",
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "#E8E4DC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  aiBubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  aiBubbleIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  aiBubbleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E53935",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#FFFFFF",
    fontWeight: "400",
  },
  aiMessageText: {
    color: "#374151",
    fontWeight: "400",
  },
  messageBold: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 15,
  },
  messageBullet: {
    color: "#374151",
    fontSize: 15,
    lineHeight: 24,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
  },
  userMessageTime: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  aiMessageTime: {
    color: "#9CA3AF",
  },

  // Typing indicator
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },

  // Input
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E8E4DC",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 10 : 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "400",
    color: "#111827",
    maxHeight: 100,
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
});
