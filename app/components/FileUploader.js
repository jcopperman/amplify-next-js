// app/components/FileUploader.js
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const FileUploader = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus('No file selected.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatus('Uploading...');
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setStatus('Upload successful! Processing...');
      console.log('Upload successful:', response.data);
      // Optionally, implement polling or WebSocket for real-time updates
    } catch (error) {
      console.error('Error uploading file:', error);
      setStatus('Upload failed.');
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div>
      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        <p>Drag 'n' drop a file here, or click to select a file</p>
      </div>
      <button onClick={handleUpload}>Upload File</button>
      <p>Status: {status}</p>
    </div>
  );
};

export default FileUploader;