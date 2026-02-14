import { Tabs } from "expo-router";
import React from "react";

import { FloatingTabBar } from "@/components/floating-tab-bar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="emergency" />
      <Tabs.Screen name="access" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
