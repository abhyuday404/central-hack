"use client";

import { useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { isAddress } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import MedicalRecord from "../constants/MedicalRecord.json";
import { MEDICAL_RECORD_ADDRESS } from "../constants/address";
import styles from "./page.module.css";

type RecordItem = {
  ipfsHash: string;
  fileName: string;
  doctor: `0x${string}`;
  timestamp: bigint;
};

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";
const ipfsGateway =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://gateway.pinata.cloud";

const abi = MedicalRecord.abi as const;

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [patientAddress, setPatientAddress] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{
    tone: "info" | "error" | "success";
    message: string;
  } | null>(null);

  const validPatient = useMemo(
    () => isAddress(patientAddress),
    [patientAddress],
  );
  const patient = useMemo(
    () =>
      (validPatient
        ? patientAddress
        : "0x0000000000000000000000000000000000000000") as `0x${string}`,
    [patientAddress, validPatient],
  );

  const requesterAddress =
    (address ??
      "0x0000000000000000000000000000000000000000") as `0x${string}`;

  const accessQuery = useReadContract({
    address: MEDICAL_RECORD_ADDRESS,
    abi,
    functionName: "hasAccess",
    args: [patient, requesterAddress],
    query: {
      enabled: validPatient && Boolean(address),
    },
  });

  const recordsQuery = useReadContract({
    address: MEDICAL_RECORD_ADDRESS,
    abi,
    functionName: "getRecords",
    args: [patient],
    query: {
      enabled: false,
    },
  });

  const hasAccess = accessQuery.data as boolean | undefined;
  const records = (recordsQuery.data ?? []) as RecordItem[];

  const handleRequestAccess = async () => {
    if (!isConnected) {
      setStatus({
        tone: "error",
        message: "Connect your wallet to request access.",
      });
      return;
    }
    if (!validPatient) {
      setStatus({
        tone: "error",
        message: "Enter a valid patient address.",
      });
      return;
    }

    try {
      setStatus({ tone: "info", message: "Submitting access request..." });
      await writeContractAsync({
        address: MEDICAL_RECORD_ADDRESS,
        abi,
        functionName: "requestAccess",
        args: [patient],
      });
      setStatus({
        tone: "success",
        message: "Access request submitted.",
      });
      await accessQuery.refetch();
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to request access.",
      });
    }
  };

  const handleUpload = async () => {
    if (!isConnected) {
      setStatus({ tone: "error", message: "Connect your wallet to upload." });
      return;
    }
    if (!validPatient) {
      setStatus({
        tone: "error",
        message: "Enter a valid patient address.",
      });
      return;
    }
    if (!file) {
      setStatus({
        tone: "error",
        message: "Select a file to upload.",
      });
      return;
    }

    try {
      setStatus({ tone: "info", message: "Uploading file to IPFS..." });
      const data = new FormData();
      data.append("file", file);

      const response = await fetch(`${backendUrl}/upload`, {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        throw new Error("Upload failed. Check backend and Pinata settings.");
      }

      const payload = (await response.json()) as {
        ipfsHash: string;
        url: string;
      };
      const recordName = fileName.trim() || file.name;

      setStatus({
        tone: "info",
        message: "Writing record metadata on-chain...",
      });
      await writeContractAsync({
        address: MEDICAL_RECORD_ADDRESS,
        abi,
        functionName: "addRecord",
        args: [patient, payload.ipfsHash, recordName],
      });

      setStatus({
        tone: "success",
        message: "Record uploaded and linked on-chain.",
      });
      setFile(null);
      setFileName("");
      await recordsQuery.refetch();
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Upload failed.",
      });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.overline}>Provider Portal</p>
          <h1 className={styles.title}>Central Hack Medical Access</h1>
          <p className={styles.subtitle}>
            Hospitals, doctors, and insurers can request patient access and
            upload verified records once approved.
          </p>
        </div>
        <div className={styles.connect}>
          <ConnectButton />
        </div>
      </header>

      <main className={styles.grid}>
        <section className={styles.card}>
          <h2>Patient Access</h2>
          <p className={styles.help}>
            Enter the patient wallet address to request access or check status.
          </p>

          <label className={styles.label} htmlFor="patientAddress">
            Patient address
          </label>
          <input
            id="patientAddress"
            className={styles.input}
            placeholder="0x..."
            value={patientAddress}
            onChange={(event) => setPatientAddress(event.target.value)}
          />

          <div className={styles.inline}>
            <button
              className={styles.primary}
              onClick={handleRequestAccess}
              disabled={isPending}
            >
              Request access
            </button>
            <button
              className={styles.secondary}
              onClick={() => accessQuery.refetch()}
              disabled={!validPatient || !address}
            >
              Check access
            </button>
          </div>

          <div className={styles.status}>
            <span>Access status:</span>
            <strong>
              {hasAccess === undefined
                ? "Unknown"
                : hasAccess
                  ? "Approved"
                  : "Not approved"}
            </strong>
          </div>
        </section>

        <section className={styles.card}>
          <h2>Upload Medical Record</h2>
          <p className={styles.help}>
            Upload the record to IPFS, then link the hash to the patient.
          </p>

          <label className={styles.label} htmlFor="fileName">
            Record title (optional)
          </label>
          <input
            id="fileName"
            className={styles.input}
            placeholder="MRI Scan, Blood Report..."
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
          />

          <label className={styles.label} htmlFor="fileInput">
            File
          </label>
          <input
            id="fileInput"
            className={styles.inputFile}
            type="file"
            onChange={(event) =>
              setFile(event.target.files ? event.target.files[0] : null)
            }
          />

          <button
            className={styles.primary}
            onClick={handleUpload}
            disabled={isPending}
          >
            Upload and link
          </button>
        </section>

        <section className={styles.card}>
          <h2>Records Snapshot</h2>
          <p className={styles.help}>
            Approved providers can load patient records metadata.
          </p>

          <div className={styles.inline}>
            <button
              className={styles.secondary}
              onClick={() => recordsQuery.refetch()}
              disabled={!validPatient || !address}
            >
              Load records
            </button>
            {recordsQuery.isFetching ? (
              <span className={styles.muted}>Loading...</span>
            ) : null}
          </div>

          {recordsQuery.error ? (
            <p className={styles.error}>
              Unable to fetch records. Ensure access is approved.
            </p>
          ) : null}

          <div className={styles.records}>
            {records.length === 0 ? (
              <p className={styles.muted}>No records available.</p>
            ) : (
              records.map((record, index) => (
                <div key={`${record.ipfsHash}-${index}`} className={styles.record}>
                  <div>
                    <h3>{record.fileName}</h3>
                    <p className={styles.muted}>
                      Uploaded by {record.doctor}
                    </p>
                  </div>
                  <div className={styles.recordMeta}>
                    <p>
                      {new Date(
                        Number(record.timestamp) * 1000,
                      ).toLocaleString()}
                    </p>
                    <a
                      className={styles.link}
                      href={`${ipfsGateway}/ipfs/${record.ipfsHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View file
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {status ? (
        <div className={`${styles.toast} ${styles[status.tone]}`}>
          {status.message}
        </div>
      ) : null}
    </div>
  );
}
