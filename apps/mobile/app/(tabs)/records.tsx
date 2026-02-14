import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

type RecentFile = {
  id: string;
  name: string;
  doctor: string;
  date: string;
};

const recentFiles: RecentFile[] = [
  { id: "1", name: "X-Ray Scan", doctor: "Dr. Sharma", date: "Yesterday" },
  { id: "2", name: "X-Ray Scan", doctor: "Dr. Sharma", date: "Yesterday" },
  { id: "3", name: "X-Ray Scan", doctor: "Dr. Sharma", date: "Yesterday" },
];

type Category = {
  id: string;
  name: string;
  subtitle: string;
  count: number;
  icon: string;
  bgColor: string;
  borderColor: string;
  iconBgColor: string;
};

const categories: Category[] = [
  {
    id: "lab",
    name: "Lab Reports",
    subtitle: "Blood Tests, Urinalysis",
    count: 6,
    icon: "heart.text.square.fill",
    bgColor: "#FEF2F2",
    borderColor: "#FECACA",
    iconBgColor: "#FCA5A5",
  },
  {
    id: "prescriptions",
    name: "Prescriptions",
    subtitle: "Active and past medications",
    count: 3,
    icon: "pills.fill",
    bgColor: "#ECFDF5",
    borderColor: "#D1FAE5",
    iconBgColor: "#6EE7B7",
  },
  {
    id: "scans",
    name: "Scans",
    subtitle: "X-Rays, MRI, CT",
    count: 2,
    icon: "person.fill.viewfinder",
    bgColor: "#FFF7ED",
    borderColor: "#FED7AA",
    iconBgColor: "#FDBA74",
  },
  {
    id: "insurance",
    name: "Insurance",
    subtitle: "Policies and Claims",
    count: 1,
    icon: "checkmark.shield.fill",
    bgColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    iconBgColor: "#93C5FD",
  },
];

export default function RecordsScreen() {
  const [searchQuery, setSearchQuery] = useState("");

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
          <View>
            <Text style={styles.pageTitle}>Records</Text>
            <Text style={styles.pageSubtitle}>
              Secure vault for your medical history
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <IconSymbol name="bell.fill" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your documents"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Recent Files */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Files</Text>
          <View style={styles.recentFilesList}>
            {recentFiles.map((file) => (
              <TouchableOpacity key={file.id} style={styles.recentFileItem}>
                <View style={styles.recentFileLeft}>
                  <View style={styles.fileIconContainer}>
                    <IconSymbol
                      name="doc.text.fill"
                      size={18}
                      color="#E53935"
                    />
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>{file.name}</Text>
                    <Text style={styles.fileMeta}>
                      {file.doctor} | {file.date}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <IconSymbol
                    name="ellipsis"
                    size={18}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: category.bgColor,
                    borderColor: category.borderColor,
                  },
                ]}
              >
                <View style={styles.categoryHeader}>
                  <View
                    style={[
                      styles.categoryIconContainer,
                      { backgroundColor: category.iconBgColor },
                    ]}
                  >
                    <IconSymbol
                      name={category.icon as any}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.categoryCountBadge}>
                    <Text style={styles.categoryCount}>{category.count}</Text>
                  </View>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categorySubtitle}>
                  {category.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    alignItems: "flex-start",
    paddingTop: 8,
    paddingBottom: 4,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "400",
  },
  notificationButton: {
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E8E5DF",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    padding: 0,
    fontWeight: "400",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  recentFilesList: {
    gap: 8,
  },
  recentFileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E8E5DF",
  },
  recentFileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  fileInfo: {
    gap: 2,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  fileMeta: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "400",
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryCountBadge: {
    backgroundColor: "rgba(0,0,0,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "400",
    lineHeight: 15,
  },
});
