"use client";

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useState } from "react";
import { Amplify} from "aws-amplify";
import outputs from "@/amplify_outputs.json"; // Ensure this path is correct
import "./../app/app.css";
import { uploadData } from '@aws-amplify/storage';

Amplify.configure(outputs);

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadStatus(null);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      setUploadStatus("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      const path = `uploads/${selectedFile.name}`;
      await uploadData({
        path: path,
        data: selectedFile,
      });

      setUploadStatus(`File "${selectedFile.name}" uploaded successfully! It will be anonymized shortly.`);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus("Failed to upload the file. Please try again.");
    } finally {
      setUploading(false);
    }
  };
}