import React, { useState } from 'react';

const InputBox = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [fileName, setFileName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() || fileName) {
      onSearch(query, fileName);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="input-section">
      <form onSubmit={handleSubmit} className="search-container">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Search or describe your research goal..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Run Analysis'}
          </button>
        </div>
        
        <div className="file-upload-group">
          <label className="file-label">
            <input 
              type="file" 
              accept=".pdf" 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
            📄 Upload PDF
          </label>
          <label className="file-label">
            <input 
              type="file" 
              accept=".txt" 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
            📝 Upload TXT
          </label>
        </div>
        
        {fileName && (
          <div className="file-name">
            Attached: {fileName}
          </div>
        )}
      </form>
    </div>
  );
};

export default InputBox;
