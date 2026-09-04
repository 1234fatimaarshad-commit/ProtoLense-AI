import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getApiErrorMessage } from '../api/client'

export default function NewProjectPage() {
  const navigate = useNavigate()
  const folderInputRef = useRef(null)
  const zipInputRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    tech_stack: '',
    repository_url: ''
  })
  const [files, setFiles] = useState([])
  const [zipFile, setZipFile] = useState(null)
  const [uploadMode, setUploadMode] = useState('folder') // 'folder' | 'zip'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [runAudit, setRunAudit] = useState(true)
  const [fileStats, setFileStats] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Handle folder selection via webkitdirectory
  const handleFolderSelect = (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    setFiles(selected)
    setZipFile(null)
    setFileStats(computeStats(selected))

    // Auto-fill project name from folder name if empty
    if (!form.name && selected[0].webkitRelativePath) {
      const topFolder = selected[0].webkitRelativePath.split('/')[0]
      if (topFolder) setForm(prev => ({ ...prev, name: topFolder }))
    }
  }

  // Handle zip file selection
  const handleZipSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setZipFile(file)
    setFiles([])
    setFileStats({ count: 1, size: file.size, label: file.name })

    // Auto-fill name from zip filename
    if (!form.name) {
      const zipName = file.name.replace(/\.zip$/i, '')
      setForm(prev => ({ ...prev, name: zipName }))
    }
  }

  function computeStats(fileList) {
    const totalSize = fileList.reduce((sum, f) => sum + f.size, 0)
    const firstPath = fileList[0]?.webkitRelativePath || ''
    const topFolder = firstPath.split('/')[0] || 'files'
    return { count: fileList.length, size: totalSize, label: topFolder }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (uploadMode === 'folder' && files.length === 0) {
      setError('Please select a project folder or upload a .zip archive')
      return
    }
    if (uploadMode === 'zip' && !zipFile) {
      setError('Please select a .zip archive')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('description', form.description)
      formData.append('tech_stack', form.tech_stack)
      formData.append('repository_url', form.repository_url)

      if (uploadMode === 'zip' && zipFile) {
        formData.append('zipfile', zipFile)
      } else {
        // Append each file individually and track relative paths
        // Use INDEX-BASED keys to avoid collisions from duplicate filenames
        const relativePaths = {}
        files.forEach((file, i) => {
          const relativePath = file.webkitRelativePath || file.name
          formData.append('files', file, file.name)
          relativePaths[i] = relativePath
        })
        formData.append('relativePaths', JSON.stringify(relativePaths))
      }

      // Axios auto-sets Content-Type with correct multipart boundary for FormData.
      // Never manually set 'Content-Type: multipart/form-data' — the boundary
      // will be missing and the server can't parse the body.
      const res = await api.post('/projects', formData, {
        onUploadProgress: (progressEvent) => {
          // Could add progress bar here in future
        }
      })

      const projectId = res.data.project.id

      if (runAudit) {
        const auditRes = await api.post(`/audits/start/${projectId}`)
        navigate(`/app/audits/${auditRes.data.audit.id}`)
      } else {
        navigate(`/app/projects/${projectId}`)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create project'))
      setLoading(false)
    }
  }

  const hasFiles = (uploadMode === 'folder' && files.length > 0) || (uploadMode === 'zip' && zipFile)

  return (
    <div className="new-project-page">
      <div className="page-header">
        <div>
          <h1>New Project Audit</h1>
          <p className="text-muted">Upload your project folder or .zip archive for multi-agent analysis</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="project-form">
        {error && <div className="error-msg">{error}</div>}

        <div className="form-section">
          <h3>Project Information</h3>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Project Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="My Awesome Project" required />
            </div>
            <div className="form-group flex-1">
              <label>Tech Stack</label>
              <input name="tech_stack" value={form.tech_stack} onChange={handleChange} placeholder="React, Node.js, PostgreSQL" />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input name="description" value={form.description} onChange={handleChange} placeholder="Brief description of your project" />
          </div>
          <div className="form-group">
            <label>Repository URL</label>
            <input name="repository_url" value={form.repository_url} onChange={handleChange} placeholder="https://github.com/user/repo" />
          </div>
        </div>

        <div className="form-section">
          <h3>Upload Project Files</h3>
          <div className="upload-mode-toggle">
            <button
              type="button"
              className={`toggle-btn ${uploadMode === 'folder' ? 'active' : ''}`}
              onClick={() => { setUploadMode('folder'); setZipFile(null); setFileStats(null) }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              Folder
            </button>
            <button
              type="button"
              className={`toggle-btn ${uploadMode === 'zip' ? 'active' : ''}`}
              onClick={() => { setUploadMode('zip'); setFiles([]); setFileStats(null) }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              .zip Archive
            </button>
          </div>

          <div className="upload-dropzone" onClick={() => {
            if (uploadMode === 'folder') folderInputRef.current?.click()
            else zipInputRef.current?.click()
          }}>
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              style={{ display: 'none' }}
              onChange={handleFolderSelect}
            />
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              style={{ display: 'none' }}
              onChange={handleZipSelect}
            />

            {fileStats ? (
              <div className="upload-selected">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <div className="upload-info">
                  <strong>{fileStats.label}</strong>
                  <span>{fileStats.count} {fileStats.count === 1 ? 'file' : 'files'} &middot; {formatSize(fileStats.size)}</span>
                </div>
                <button
                  type="button"
                  className="upload-clear"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFiles([])
                    setZipFile(null)
                    setFileStats(null)
                    if (folderInputRef.current) folderInputRef.current.value = ''
                    if (zipInputRef.current) zipInputRef.current.value = ''
                  }}
                >
                  &times;
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <strong>
                  {uploadMode === 'folder' ? 'Click to select a project folder' : 'Click to select a .zip archive'}
                </strong>
                <span>
                  {uploadMode === 'folder'
                    ? 'All files in the folder will be uploaded and analyzed'
                    : 'Upload a .zip file of your project'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="checkbox-group">
            <input type="checkbox" id="runAudit" checked={runAudit} onChange={e => setRunAudit(e.target.checked)} />
            <label htmlFor="runAudit">Run full agent audit pipeline immediately after upload</label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/app/dashboard')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading || !hasFiles}>
            {loading ? (
              <><span className="spinner-small"></span> Uploading & Analyzing...</>
            ) : (
              <>{runAudit ? 'Upload & Run Audit' : 'Upload Project'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
