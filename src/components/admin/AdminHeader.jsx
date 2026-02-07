import { useRef } from "react";

export default function AdminHeader({
  user,
  userProfile,
  editingProfile,
  onStartEditProfile,
  onCancelEditProfile,
  onSaveProfile,
  onProfileChange,
  onProfileImageChange,
  onProfileImageRemove,
  hasProfileChanged,
  uploading,
  onSignOut
}) {
  const fileInputRef = useRef(null);
  const hasPhoto = Boolean(userProfile.photoURL);

  const handlePickFile = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <header className="admin-header">
      <div className={`user-profile ${editingProfile ? "editing" : ""}`}>
        <div className="avatar-wrapper">
          {hasPhoto ? (
            <img src={userProfile.photoURL} alt="Avatar" className="avatar" />
          ) : (
            <div className="avatar avatar-fallback" aria-label="Avatar genérico">
              <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
                <circle cx="32" cy="24" r="14" />
                <path d="M12 58c4-12 16-18 20-18s16 6 20 18" />
              </svg>
            </div>
          )}
          {editingProfile && hasPhoto && (
            <button type="button" className="avatar-action remove" onClick={onProfileImageRemove} aria-label="Remover foto">
              ×
            </button>
          )}
          {editingProfile && !hasPhoto && (
            <button type="button" className="avatar-action add" onClick={handlePickFile} aria-label="Adicionar foto">
              +
            </button>
          )}
          {editingProfile && (
            <input ref={fileInputRef} type="file" accept="image/*" className="avatar-input" onChange={onProfileImageChange} />
          )}
        </div>
        <div className="user-info">
          {!editingProfile ? (
            <>
              <strong className="user-name">{userProfile.displayName || user.email}</strong>
              <button className="edit-profile-link" onClick={onStartEditProfile}>Editar perfil</button>
            </>
          ) : (
            <>
              <input type="text" placeholder="Seu nome" value={userProfile.displayName} onChange={e => onProfileChange({ ...userProfile, displayName: e.target.value })} />
              <div className="profile-actions">
                <button className="admin-btn primary" disabled={!hasProfileChanged() || uploading} onClick={onSaveProfile}>
                  {uploading ? "Enviando..." : "Salvar perfil"}
                </button>
                <button className="admin-btn cancel" onClick={onCancelEditProfile}>Cancelar</button>
              </div>
            </>
          )}
        </div>
      </div>
      <button className="admin-logout" onClick={onSignOut}>Sair</button>
    </header>
  );
}
