import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ConnectButton, useAccount, useProvider } from '@reown/appkit-react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMedicalRecordContract, requestStatusLabel, type AccessRequest } from '@/lib/medicalRecord';

export default function ApprovalScreen() {
  const { address, isConnected } = useAccount();
  const { provider } = useProvider();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!provider || !address) {
      setStatus('Connect your wallet to load requests.');
      return;
    }

    try {
      const contract = await getMedicalRecordContract(provider);
      const data = (await contract.getRequests(address)) as AccessRequest[];
      setRequests(data);
      setStatus(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to load requests.');
    }
  }, [address, provider]);

  const resolveRequest = useCallback(
    async (requestId: number, approve: boolean) => {
      if (!provider || !address) {
        setStatus('Connect your wallet to approve requests.');
        return;
      }
      try {
        setStatus(approve ? 'Approving request...' : 'Rejecting request...');
        const contract = await getMedicalRecordContract(provider);
        const tx = await contract.respondToRequest(requestId, approve);
        await tx.wait();
        await loadRequests();
        setStatus(approve ? 'Request approved.' : 'Request rejected.');
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Action failed.');
      }
    },
    [address, loadRequests, provider],
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#e9f0f7', dark: '#1b2a36' }}
      headerImage={<View style={styles.headerAccent} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Access approvals</ThemedText>
        <ThemedText type="subtitle">
          Review hospital, doctor, or insurer requests for your records.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ConnectButton label="Connect wallet" loadingLabel="Connecting..." />
        <ThemedText onPress={loadRequests} style={styles.link}>
          Refresh requests
        </ThemedText>
        <ThemedText type="default" style={styles.muted}>
          Connected: {isConnected ? address : 'Not connected'}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Pending requests</ThemedText>
        {status ? <ThemedText style={styles.status}>{status}</ThemedText> : null}
        {requests.length === 0 ? (
          <ThemedText style={styles.muted}>No requests yet.</ThemedText>
        ) : (
          requests.map((request, index) => (
            <ThemedView key={`${request.requester}-${index}`} style={styles.card}>
              <ThemedText type="defaultSemiBold">{request.requester}</ThemedText>
              <ThemedText style={styles.muted}>
                {new Date(Number(request.timestamp) * 1000).toLocaleString()}
              </ThemedText>
              <ThemedText style={styles.status}>
                Status: {requestStatusLabel(request.status)}
              </ThemedText>
              {request.status === 0n ? (
                <View style={styles.inline}>
                  <ThemedText
                    onPress={() => resolveRequest(index, true)}
                    style={styles.primaryButton}
                  >
                    Approve
                  </ThemedText>
                  <ThemedText
                    onPress={() => resolveRequest(index, false)}
                    style={styles.secondaryButton}
                  >
                    Reject
                  </ThemedText>
                </View>
              ) : null}
            </ThemedView>
          ))
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerAccent: {
    height: 180,
    borderRadius: 24,
    backgroundColor: '#c3d3e6',
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
    borderColor: '#dde3ea',
    gap: 6,
  },
  link: {
    color: '#0b2a4a',
    fontWeight: '600',
  },
  inline: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#0b2a4a',
    color: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  secondaryButton: {
    backgroundColor: '#e6ebf2',
    color: '#0c1b2a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  muted: {
    opacity: 0.7,
  },
  status: {
    color: '#2f3e4e',
  },
});
