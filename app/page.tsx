"use client";

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useState } from "react";
import { Amplify } from "aws-amplify";
import Storage from "@aws-amplify/storage"; // Correct Named Import
import outputs from "@/amplify_outputs.json"; // Ensure this path is correct
import "./../app/app.css";

Amplify.configure(outputs);

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  /**
   * Handle file selection
   * @param event - File input change event
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadStatus(null);
    }
  };

  /**
   * Upload the selected file to S3
   */
  const uploadFile = async () => {
    if (!selectedFile) {
      setUploadStatus("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      const fileName = `uploads/${selectedFile.name}`;
      // Upload file to S3 using the correctly imported Storage module
      await Storage.put(fileName, selectedFile, {
        contentType: selectedFile.type,
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

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main className="container">
          <h1>Data Anonymizer</h1>
          <div className="upload-section">
            <input 
              type="file" 
              accept=".json, .csv" 
              onChange={handleFileChange} 
            />
            <button 
              onClick={uploadFile} 
              disabled={uploading || !selectedFile}
            >
              {uploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
          {uploadStatus && <p className="status-message">{uploadStatus}</p>}
          <div className="info-section">
            🥳 File successfully uploaded! The anonymizer will process your data.
            <br />
            <a href="https://docs.aws.amazon.com/lambda/latest/dg/welcome.html" target="_blank" rel="noopener noreferrer">
              Learn more about AWS Lambda
            </a>
          </div>
          <button onClick={signOut} className="signout-button">Sign out</button>
        </main>
      )}
    </Authenticator>
  );
}