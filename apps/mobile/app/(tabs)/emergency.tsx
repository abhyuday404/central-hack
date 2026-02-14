import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function EmergencyScreen() {
  const handleCallEmergency = () => {
    Linking.openURL("tel:112");
  };

  const handleCallContact = () => {
    Linking.openURL("tel:+919876543210");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5F0" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.emergencyIcon}>
              <IconSymbol name="staroflife.fill" size={20} color="#E53935" />
            </View>
            <Text style={styles.pageTitle}>Emergency Information</Text>
          </View>
        </View>

        {/* Patient Identity Card */}
        <View style={styles.identityCard}>
          <View style={styles.identityHeader}>
            <View>
              <Text style={styles.identityLabel}>Name</Text>
              <Text style={styles.identityName}>Nimesha S</Text>
            </View>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>ID: #6767-NS</Text>
            </View>
          </View>

          <View style={styles.identityRow}>
            <View style={styles.identityItem}>
              <Text style={styles.identityLabel}>Date Of Birth</Text>
              <Text style={styles.identityValue}>10.06.2006</Text>
            </View>
            <View style={styles.identityItem}>
              <Text style={styles.identityLabel}>Gender</Text>
              <Text style={styles.identityValue}>Female</Text>
            </View>
            <View style={styles.identityItem}>
              <Text style={styles.identityLabel}>Age</Text>
              <Text style={styles.identityValue}>20</Text>
            </View>
          </View>
        </View>

        {/* Vitals Row */}
        <View style={styles.vitalsRow}>
          {/* Blood Group */}
          <View style={[styles.vitalCard, styles.bloodGroupCard]}>
            <Text style={styles.vitalLabel}>Blood Group</Text>
            <Text style={styles.vitalValueLarge}>O+</Text>
          </View>

          {/* Weight & Height */}
          <View style={[styles.vitalCard, styles.weightHeightCard]}>
            <View style={styles.weightHeightInner}>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Weight</Text>
                <Text style={styles.vitalValueLarge}>
                  50<Text style={styles.vitalUnit}>kg</Text>
                </Text>
              </View>
              <View style={styles.vitalDivider} />
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Height</Text>
                <Text style={styles.vitalValueLarge}>
                  160<Text style={styles.vitalUnit}>cm</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Allergies & Conditions Row */}
        <View style={styles.conditionsRow}>
          {/* Allergies */}
          <View style={[styles.conditionCard, styles.allergiesCard]}>
            <Text style={styles.conditionCardLabel}>Allergies</Text>
            <View style={styles.tagRow}>
              <View style={styles.allergyTag}>
                <Text style={styles.allergyTagText}>Dairy</Text>
              </View>
              <View style={styles.allergyTag}>
                <Text style={styles.allergyTagText}>Peanuts</Text>
              </View>
            </View>
          </View>

          {/* Conditions */}
          <View style={[styles.conditionCard, styles.conditionsCard]}>
            <Text style={styles.conditionCardLabel}>Conditions</Text>
            <View style={styles.tagRow}>
              <View style={styles.conditionTag}>
                <Text style={styles.conditionTagText}>Type-1 Diabetes</Text>
              </View>
              <View style={styles.conditionTag}>
                <Text style={styles.conditionTagText}>Asthma</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.emergencyContactCard}>
          <View style={styles.emergencyContactHeader}>
            <Text style={styles.emergencyContactLabel}>EMERGENCY CONTACT</Text>
          </View>
          <View style={styles.emergencyContactBody}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>Abhyuday Rai</Text>
              <Text style={styles.contactRelation}>Relation: Caretaker</Text>
              <Text style={styles.contactPhone}>+91 98765 43210</Text>
            </View>
            <TouchableOpacity
              style={styles.callContactButton}
              onPress={handleCallContact}
            >
              <IconSymbol name="phone.fill" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconContainer}>
              <IconSymbol name="location.fill" size={18} color="#22C55E" />
            </View>
            <Text style={styles.actionButtonText}>
              Send Live Location to trusted circle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.emergencyCallButton]}
            onPress={handleCallEmergency}
          >
            <View
              style={[styles.actionIconContainer, styles.emergencyCallIconBg]}
            >
              <IconSymbol name="phone.fill" size={18} color="#E53935" />
            </View>
            <Text
              style={[styles.actionButtonText, styles.emergencyCallButtonText]}
            >
              Call Emergency Services
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Read Only • Limited access for emergency use
        </Text>
      </ScrollView>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emergencyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  // Identity Card
  identityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E5DF",
  },
  identityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  identityName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },
  identityLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  idBadge: {
    backgroundColor: "#FFF9C4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  idBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  identityRow: {
    flexDirection: "row",
    gap: 28,
  },
  identityItem: {
    gap: 2,
  },
  identityValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },

  // Vitals Row
  vitalsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  vitalCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  bloodGroupCard: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  weightHeightCard: {
    backgroundColor: "#ECFDF5",
    borderColor: "#D1FAE5",
    flex: 1.6,
  },
  weightHeightInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  vitalItem: {
    alignItems: "center",
    gap: 2,
  },
  vitalDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#A7F3D0",
  },
  vitalLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  vitalValueLarge: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },
  vitalUnit: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },

  // Conditions Row
  conditionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  conditionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  allergiesCard: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
  },
  conditionsCard: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  conditionCardLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  allergyTag: {
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  allergyTagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#C2410C",
  },
  conditionTag: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  conditionTagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1D4ED8",
  },

  // Emergency Contact
  emergencyContactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8E5DF",
  },
  emergencyContactHeader: {
    marginBottom: 10,
  },
  emergencyContactLabel: {
    fontSize: 10,
    color: "#E53935",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  emergencyContactBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactInfo: {
    gap: 2,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  contactRelation: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "400",
  },
  contactPhone: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
    marginTop: 2,
  },
  callContactButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  // Action Buttons
  actionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E8E5DF",
    gap: 12,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  emergencyCallButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  emergencyCallIconBg: {
    backgroundColor: "#FEE2E2",
  },
  emergencyCallButtonText: {
    color: "#E53935",
  },

  // Footer
  footerNote: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 8,
  },
});
