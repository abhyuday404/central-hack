import React, { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { ConnectButton, useAccount, useProvider } from '@reown/appkit-react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMedicalRecordContract, type RecordItem } from '@/lib/medicalRecord';

const ipfsGateway =
  process.env.EXPO_PUBLIC_IPFS_GATEWAY ?? 'https://gateway.pinata.cloud';

export default function RecordsScreen() {
  const { address } = useAccount();
  const { provider } = useProvider();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const loadRecords = async () => {
    if (!provider || !address) {
      setStatus('Connect your wallet to view records.');
      return;
    }
    try {
      setStatus('Loading records...');
      const contract = await getMedicalRecordContract(provider);
      const data = (await contract.getRecords(address)) as RecordItem[];
      setRecords(data);
      setStatus(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to load records.');
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#f1eee9', dark: '#2b2b2b' }}
      headerImage={<View style={styles.headerAccent} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">My records</ThemedText>
        <ThemedText type="subtitle">
          View the files you have approved for access.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ConnectButton label="Connect wallet" loadingLabel="Connecting..." />
        <ThemedText onPress={loadRecords} style={styles.link}>
          Refresh records
        </ThemedText>
        {status ? <ThemedText style={styles.status}>{status}</ThemedText> : null}
      </ThemedView>

      <ThemedView style={styles.section}>
        {records.length === 0 ? (
          <ThemedText style={styles.muted}>No records available.</ThemedText>
        ) : (
          records.map((record, index) => (
            <ThemedView key={`${record.ipfsHash}-${index}`} style={styles.card}>
              <ThemedText type="defaultSemiBold">{record.fileName}</ThemedText>
              <ThemedText style={styles.muted}>Uploaded by {record.doctor}</ThemedText>
              <ThemedText style={styles.muted}>
                {new Date(Number(record.timestamp) * 1000).toLocaleString()}
              </ThemedText>
              <ThemedText
                style={styles.link}
                onPress={() => Linking.openURL(`${ipfsGateway}/ipfs/${record.ipfsHash}`)}
              >
                Open file
              </ThemedText>
            </ThemedView>
          ))
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerAccent: {
    height: 170,
    borderRadius: 24,
    backgroundColor: '#d9d1c7',
  },
  titleContainer: {
    gap: 8,
  },
  section: {
    gap: 12,
    marginTop: 8,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e2e7',
    gap: 6,
  },
  link: {
    color: '#0b2a4a',
    fontWeight: '600',
  },
  muted: {
    opacity: 0.7,
  },
  status: {
    color: '#2f3e4e',
  },
});
