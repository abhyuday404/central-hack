import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  loadProfile,
  addTrustedContact,
  removeTrustedContact,
  updateTrustedContact,
  type TrustedContact,
} from "@/lib/profile-storage";
import { truncateAddress } from "@/lib/medicalRecord";

const RELATIONSHIP_OPTIONS = [
  "Family Member",
  "Spouse / Partner",
  "Parent",
  "Child",
  "Sibling",
  "Caretaker",
  "Primary Doctor",
  "Specialist",
  "Therapist",
  "Other",
];

function isValidEthAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function getContactInitials(label: string): string {
  return label
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getContactColor(addr: string): string {
  const colors = [
    "#6366F1",
    "#E53935",
    "#0EA5E9",
    "#22C55E",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#3B82F6",
  ];
  const sum = addr
    .toLowerCase()
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[sum % colors.length]!;
}

function timeSinceAdded(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Added today";
  if (days === 1) return "Added yesterday";
  if (days < 30) return `Added ${days}d ago`;
  if (days < 365) return `Added ${Math.floor(days / 30)}mo ago`;
  return `Added ${Math.floor(days / 365)}y ago`;
}

export default function TrustedCircleScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editContact, setEditContact] = useState<TrustedContact | null>(null);

  // Form state
  const [formAddress, setFormAddress] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formRelationship, setFormRelationship] = useState(
    RELATIONSHIP_OPTIONS[0]!,
  );
  const [showRelPicker, setShowRelPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await loadProfile();
      setContacts(profile.trustedCircle ?? []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const resetForm = () => {
    setFormAddress("");
    setFormLabel("");
    setFormRelationship(RELATIONSHIP_OPTIONS[0]!);
    setEditContact(null);
    setShowRelPicker(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (contact: TrustedContact) => {
    setEditContact(contact);
    setFormAddress(contact.walletAddress);
    setFormLabel(contact.label);
    setFormRelationship(contact.relationship);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSubmit = async () => {
    const trimmedAddr = formAddress.trim();
    const trimmedLabel = formLabel.trim();

    if (!trimmedLabel) {
      Alert.alert(
        "Missing Name",
        "Please enter a name or label for this contact.",
      );
      return;
    }
    if (!isValidEthAddress(trimmedAddr)) {
      Alert.alert(
        "Invalid Address",
        "Please enter a valid Ethereum wallet address (0x followed by 40 hex characters).",
      );
      return;
    }

    setSubmitting(true);
    try {
      if (editContact) {
        const updated = await updateTrustedContact(editContact.id, {
          walletAddress: trimmedAddr,
          label: trimmedLabel,
          relationship: formRelationship,
        });
        setContacts(updated.trustedCircle);
        Alert.alert("Updated", `${trimmedLabel} has been updated.`);
      } else {
        const updated = await addTrustedContact({
          walletAddress: trimmedAddr,
          label: trimmedLabel,
          relationship: formRelationship,
        });
        setContacts(updated.trustedCircle);
        Alert.alert(
          "Added",
          `${trimmedLabel} has been added to your trusted circle.`,
        );
      }
      closeModal();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = (contact: TrustedContact) => {
    Alert.alert(
      "Remove Contact",
      `Remove ${contact.label} from your trusted circle?\n\nThis will not revoke any existing on-chain access.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const updated = await removeTrustedContact(contact.id);
              setContacts(updated.trustedCircle);
            } catch {
              Alert.alert("Error", "Failed to remove contact.");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F5F0" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading trusted circle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5F0" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol name="chevron.left" size={18} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Trusted Circle</Text>
            <TouchableOpacity
              style={styles.addHeaderButton}
              onPress={openAddModal}
            >
              <IconSymbol name="plus" size={18} color="#6366F1" />
            </TouchableOpacity>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <View style={styles.infoBannerIcon}>
              <IconSymbol name="shield.fill" size={18} color="#6366F1" />
            </View>
            <View style={styles.infoBannerContent}>
              <Text style={styles.infoBannerTitle}>Your Trusted Circle</Text>
              <Text style={styles.infoBannerText}>
                Add family members, caregivers, and healthcare providers you
                trust. When they request access to your records, they{"'"}ll be
                highlighted for quick approval.
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View
                style={[styles.statIconWrap, { backgroundColor: "#EEF2FF" }]}
              >
                <IconSymbol name="person.2.fill" size={16} color="#6366F1" />
              </View>
              <Text style={styles.statValue}>{contacts.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <View
                style={[styles.statIconWrap, { backgroundColor: "#FEF2F2" }]}
              >
                <IconSymbol name="heart.fill" size={16} color="#E53935" />
              </View>
              <Text style={styles.statValue}>
                {
                  contacts.filter(
                    (c) =>
                      c.relationship === "Family Member" ||
                      c.relationship === "Spouse / Partner" ||
                      c.relationship === "Parent" ||
                      c.relationship === "Child" ||
                      c.relationship === "Sibling",
                  ).length
                }
              </Text>
              <Text style={styles.statLabel}>Family</Text>
            </View>
            <View style={styles.statCard}>
              <View
                style={[styles.statIconWrap, { backgroundColor: "#F0FDF4" }]}
              >
                <IconSymbol name="cross.case.fill" size={16} color="#22C55E" />
              </View>
              <Text style={styles.statValue}>
                {
                  contacts.filter(
                    (c) =>
                      c.relationship === "Primary Doctor" ||
                      c.relationship === "Specialist" ||
                      c.relationship === "Therapist",
                  ).length
                }
              </Text>
              <Text style={styles.statLabel}>Medical</Text>
            </View>
          </View>

          {/* Contact List */}
          {contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <IconSymbol
                  name="person.badge.plus"
                  size={36}
                  color="#D1D5DB"
                />
              </View>
              <Text style={styles.emptyTitle}>No Trusted Contacts Yet</Text>
              <Text style={styles.emptySubtext}>
                Add people you trust to manage and access your health records.
                They{"'"}ll be flagged when requesting access for quicker
                approval.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={openAddModal}
              >
                <IconSymbol name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.emptyAddButtonText}>Add First Contact</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.contactList}>
              {contacts.map((contact) => (
                <View key={contact.id} style={styles.contactCard}>
                  <View style={styles.contactCardTop}>
                    <View style={styles.contactLeft}>
                      <View
                        style={[
                          styles.contactAvatar,
                          {
                            backgroundColor:
                              getContactColor(contact.walletAddress) + "18",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.contactAvatarText,
                            {
                              color: getContactColor(contact.walletAddress),
                            },
                          ]}
                        >
                          {getContactInitials(contact.label)}
                        </Text>
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{contact.label}</Text>
                        <Text style={styles.contactAddress}>
                          {truncateAddress(contact.walletAddress)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.contactActions}>
                      <TouchableOpacity
                        style={styles.contactEditBtn}
                        onPress={() => openEditModal(contact)}
                      >
                        <IconSymbol name="pencil" size={14} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.contactRemoveBtn}
                        onPress={() => handleRemove(contact)}
                      >
                        <IconSymbol name="trash" size={14} color="#E53935" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.contactMeta}>
                    <View style={styles.contactRelBadge}>
                      <IconSymbol
                        name={
                          contact.relationship === "Primary Doctor" ||
                          contact.relationship === "Specialist" ||
                          contact.relationship === "Therapist"
                            ? "stethoscope"
                            : contact.relationship === "Caretaker"
                              ? "hand.raised.fill"
                              : "heart.fill"
                        }
                        size={10}
                        color={
                          contact.relationship === "Primary Doctor" ||
                          contact.relationship === "Specialist" ||
                          contact.relationship === "Therapist"
                            ? "#0EA5E9"
                            : contact.relationship === "Caretaker"
                              ? "#F59E0B"
                              : "#E53935"
                        }
                      />
                      <Text style={styles.contactRelText}>
                        {contact.relationship}
                      </Text>
                    </View>
                    <Text style={styles.contactDate}>
                      {timeSinceAdded(contact.addedAt)}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Add another button */}
              <TouchableOpacity
                style={styles.addAnotherButton}
                onPress={openAddModal}
              >
                <IconSymbol name="plus.circle.fill" size={20} color="#6366F1" />
                <Text style={styles.addAnotherText}>Add Another Contact</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeModal}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editContact ? "Edit Contact" : "Add Trusted Contact"}
              </Text>
              <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
                <Text
                  style={[
                    styles.modalSave,
                    submitting && styles.modalSaveDisabled,
                  ]}
                >
                  {submitting ? "Saving..." : editContact ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Avatar Preview */}
              <View style={styles.modalAvatarSection}>
                <View
                  style={[
                    styles.modalAvatar,
                    {
                      backgroundColor:
                        formAddress && isValidEthAddress(formAddress.trim())
                          ? getContactColor(formAddress.trim()) + "18"
                          : "#F3F4F6",
                    },
                  ]}
                >
                  {formLabel.trim() ? (
                    <Text
                      style={[
                        styles.modalAvatarText,
                        {
                          color:
                            formAddress && isValidEthAddress(formAddress.trim())
                              ? getContactColor(formAddress.trim())
                              : "#9CA3AF",
                        },
                      ]}
                    >
                      {getContactInitials(formLabel.trim())}
                    </Text>
                  ) : (
                    <IconSymbol name="person.fill" size={28} color="#D1D5DB" />
                  )}
                </View>
              </View>

              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name / Label</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Mom, Dr. Sharma"
                  placeholderTextColor="#9CA3AF"
                  value={formLabel}
                  onChangeText={setFormLabel}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Wallet Address */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Wallet Address</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    styles.formInputMono,
                    formAddress.trim().length > 0 &&
                      !isValidEthAddress(formAddress.trim()) &&
                      styles.formInputError,
                  ]}
                  placeholder="0x..."
                  placeholderTextColor="#9CA3AF"
                  value={formAddress}
                  onChangeText={setFormAddress}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                />
                {formAddress.trim().length > 0 &&
                  !isValidEthAddress(formAddress.trim()) && (
                    <Text style={styles.formError}>
                      Enter a valid Ethereum address (0x + 40 hex chars)
                    </Text>
                  )}
                {formAddress.trim().length > 0 &&
                  isValidEthAddress(formAddress.trim()) && (
                    <View style={styles.formSuccess}>
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={12}
                        color="#22C55E"
                      />
                      <Text style={styles.formSuccessText}>Valid address</Text>
                    </View>
                  )}
              </View>

              {/* Relationship */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Relationship</Text>
                <TouchableOpacity
                  style={styles.formSelect}
                  onPress={() => setShowRelPicker(!showRelPicker)}
                >
                  <Text style={styles.formSelectText}>{formRelationship}</Text>
                  <IconSymbol
                    name={showRelPicker ? "chevron.up" : "chevron.down"}
                    size={14}
                    color="#6B7280"
                  />
                </TouchableOpacity>
                {showRelPicker && (
                  <View style={styles.pickerDropdown}>
                    {RELATIONSHIP_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.pickerOption,
                          opt === formRelationship && styles.pickerOptionActive,
                        ]}
                        onPress={() => {
                          setFormRelationship(opt);
                          setShowRelPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            opt === formRelationship &&
                              styles.pickerOptionTextActive,
                          ]}
                        >
                          {opt}
                        </Text>
                        {opt === formRelationship && (
                          <IconSymbol
                            name="checkmark"
                            size={14}
                            color="#6366F1"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Hint */}
              <View style={styles.formHint}>
                <IconSymbol name="info.circle.fill" size={14} color="#9CA3AF" />
                <Text style={styles.formHintText}>
                  Adding someone to your trusted circle does not automatically
                  grant them access. When they request access, they{"'"}ll be
                  highlighted so you can approve faster.
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F5F0",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F5F0",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  addHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },

  // Info Banner
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  infoBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  infoBannerContent: {
    flex: 1,
    gap: 4,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#312E81",
  },
  infoBannerText: {
    fontSize: 13,
    color: "#4338CA",
    lineHeight: 18,
    fontWeight: "400",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E8E5DF",
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E5DF",
    gap: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  emptyAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6366F1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyAddButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Contact List
  contactList: {
    gap: 12,
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8E5DF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contactCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  contactAvatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  contactAddress: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  contactRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  contactMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  contactRelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  contactRelText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  contactDate: {
    fontSize: 11,
    fontWeight: "400",
    color: "#9CA3AF",
  },

  // Add Another
  addAnotherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
    borderStyle: "dashed",
  },
  addAnotherText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6366F1",
  },

  // Modal
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#F7F5F0",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  modalCancel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6366F1",
  },
  modalSaveDisabled: {
    opacity: 0.4,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 16,
    gap: 20,
  },

  // Modal Avatar Preview
  modalAvatarSection: {
    alignItems: "center",
    paddingVertical: 12,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  modalAvatarText: {
    fontSize: 24,
    fontWeight: "700",
  },

  // Form
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  formInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  formInputMono: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 13,
  },
  formInputError: {
    borderColor: "#E53935",
    backgroundColor: "#FEF2F2",
  },
  formError: {
    fontSize: 12,
    color: "#E53935",
    fontWeight: "500",
    marginTop: -2,
  },
  formSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: -2,
  },
  formSuccessText: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: "500",
  },
  formSelect: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  formSelectText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  pickerDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerOptionActive: {
    backgroundColor: "#EEF2FF",
  },
  pickerOptionText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "400",
  },
  pickerOptionTextActive: {
    color: "#6366F1",
    fontWeight: "600",
  },

  // Hint
  formHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  formHintText: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
});
