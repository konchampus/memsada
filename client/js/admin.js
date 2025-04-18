const { useState, useEffect } = React;

function AdminPanel() {
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [activeTab, setActiveTab] = useState('cases');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [cases, setCases] = useState([]);
    const [tariffs, setTariffs] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [mediaItems, setMediaItems] = useState([]);
    const [reposts, setReposts] = useState([]);
    const [partners, setPartners] = useState([]);
    const [orders, setOrders] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [logs, setLogs] = useState([]);
    const [settings, setSettings] = useState({ bannerEnabled: false, bannerText: '', bannerColor: '', bannerImage: '', videoUrl: '/assets/demo.mp4' });
    const [newCase, setNewCase] = useState({ title: '', description: '', image: null, pdf: null });
    const [newTariff, setNewTariff] = useState({ title: '', shortDescription: '', fullDescription: '', features: [], image: null, isVisible: true });
    const [newTeamMember, setNewTeamMember] = useState({ name: '', description: '', image: null, order: 0 });
    const [newMedia, setNewMedia] = useState({ title: '', description: '', link: '', image: null });
    const [newRepost, setNewRepost] = useState({ title: '', description: '', link: '', image: null });
    const [newPartner, setNewPartner] = useState({ name: '', image: null });
    const [newAdmin, setNewAdmin] = useState({ email: '', password: '' });
    const [changePassword, setChangePassword] = useState({ oldPassword: '', newPassword: '' });
    const [previewImage, setPreviewImage] = useState(null);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/auth/verify', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Токен недействителен');
            } catch {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            }
        };

        verifyToken();

        const fetchData = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const endpoints = [
                    { url: 'cases', setter: setCases },
                    { url: 'tariffs', setter: setTariffs },
                    { url: 'team-members', setter: setTeamMembers },
                    { url: 'media', setter: setMediaItems },
                    { url: 'reposts', setter: setReposts },
                    { url: 'partners', setter: setPartners },
                    { url: 'orders', setter: setOrders },
                    { url: 'auth/admins', setter: setAdmins },
                    { url: 'auth/logs', setter: setLogs },
                    { url: 'settings', setter: setSettings }
                ];

                const responses = await Promise.all(
                    endpoints.map(e => fetch(`http://localhost:5000/api/${e.url}`, { headers }))
                );
                const data = await Promise.all(responses.map(r => r.json()));

                endpoints.forEach((e, i) => {
                    const sortedData = ['cases', 'team-members', 'media', 'reposts'].includes(e.url)
                        ? data[i].sort((a, b) => a.position - b.position)
                        : data[i];
                    e.setter(sortedData);
                });

                setError('');
            } catch (err) {
                setError('Не удалось загрузить данные');
            }
        };

        fetchData();
    }, [token]);

    const handleImageChange = (e, type, setState) => {
        const file = e.target.files[0];
        if (file) {
            setState(prev => ({ ...prev, [type]: file }));
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setPreviewImage(reader.result);
                reader.readAsDataURL(file);
            } else {
                setPreviewImage(null);
            }
        }
    };

    const handleSubmit = async (e, endpoint, state, setState, isEdit = false, id = '') => {
        e.preventDefault();
        const formData = new FormData();
        Object.entries(state).forEach(([key, value]) => {
            if (key === 'features') {
                formData.append(key, JSON.stringify(value));
            } else if (value instanceof File) {
                formData.append(key, value);
            } else if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });

        try {
            const url = isEdit ? `http://localhost:5000/api/${endpoint}/${id}` : `http://localhost:5000/api/${endpoint}`;
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.message) {
                setState(endpoint === 'cases' ? { title: '', description: '', image: null, pdf: null } :
                        endpoint === 'tariffs' ? { title: '', shortDescription: '', fullDescription: '', features: [], image: null, isVisible: true } :
                        endpoint === 'team-members' ? { name: '', description: '', image: null, order: 0 } :
                        endpoint === 'media' ? { title: '', description: '', link: '', image: null } :
                        endpoint === 'reposts' ? { title: '', description: '', link: '', image: null } :
                        endpoint === 'partners' ? { name: '', image: null } : state);
                setPreviewImage(null);
                const setter = {
                    cases: setCases,
                    tariffs: setTariffs,
                    'team-members': setTeamMembers,
                    media: setMediaItems,
                    reposts: setReposts,
                    partners: setPartners
                }[endpoint];
                if (setter) {
                    const res = await fetch(`http://localhost:5000/api/${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
                    const updatedData = await res.json();
                    setter(updatedData.sort((a, b) => a.position - b.position));
                }
                setError('');
                alert(isEdit ? 'Обновлено успешно' : 'Добавлено успешно');
            } else {
                setError(data.error || 'Ошибка выполнения');
            }
        } catch (err) {
            setError('Ошибка соединения с сервером');
        }
    };

    const handleDelete = async (endpoint, id) => {
        if (!window.confirm('Вы уверены, что хотите удалить?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/${endpoint}/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.message) {
                const setter = {
                    cases: setCases,
                    tariffs: setTariffs,
                    'team-members': setTeamMembers,
                    media: setMediaItems,
                    reposts: setReposts,
                    partners: setPartners,
                    orders: setOrders,
                    admins: setAdmins
                }[endpoint];
                const res = await fetch(`http://localhost:5000/api/${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
                setter(await res.json());
                setError('');
                alert('Удалено успешно');
            } else {
                setError(data.error || 'Ошибка удаления');
            }
        } catch (err) {
            setError('Ошибка соединения с сервером');
        }
    };

    const handleToggleVisibility = async (endpoint, id, isVisible) => {
        try {
            const res = await fetch(`http://localhost:5000/api/${endpoint}/${id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isVisible: !isVisible })
            });
            const data = await res.json();
            if (data.message) {
                const setter = {
                    cases: setCases,
                    tariffs: setTariffs,
                    'team-members': setTeamMembers,
                    media: setMediaItems,
                    reposts: setReposts
                }[endpoint];
                const res = await fetch(`http://localhost:5000/api/${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
                setter(await res.json());
                setError('');
                alert(`Элемент ${!isVisible ? 'показан' : 'скрыт'}`);
            } else {
                setError(data.error || 'Ошибка изменения видимости');
            }
        } catch (err) {
            setError('Ошибка соединения с сервером');
        }
    };

    const handleDragEnd = async (draggedId, droppedId, endpoint, items, setItems) => {
        const draggedIndex = items.findIndex(item => item._id === draggedId);
        const droppedIndex = items.findIndex(item => item._id === droppedId);
        if (draggedIndex === droppedIndex) return;

        const updatedItems = [...items];
        const [draggedItem] = updatedItems.splice(draggedIndex, 1);
        updatedItems.splice(droppedIndex, 0, draggedItem);

        const updatedItemsWithPosition = updatedItems.map((item, index) => ({
            ...item,
            position: index
        }));

        setItems(updatedItemsWithPosition);

        try {
            await fetch(`http://localhost:5000/api/${endpoint}/reorder`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ order: updatedItemsWithPosition.map(item => item._id) })
            });
        } catch (err) {
            setError('Ошибка обновления порядка');
        }
    };

    const handleSettings = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('bannerEnabled', settings.bannerEnabled);
        formData.append('bannerText', settings.bannerText);
        formData.append('bannerColor', settings.bannerColor);
        formData.append('videoUrl', settings.videoUrl);
        if (settings.bannerImage instanceof File) {
            formData.append('bannerImage', settings.bannerImage);
        }

        try {
            const res = await fetch('http://localhost:5000/api/settings', {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.message) {
                setError('');
                alert('Настройки сохранены');
            } else {
                setError(data.error || 'Ошибка сохранения настроек');
            }
        } catch (err) {
            setError('Ошибка соединения с сервером');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(changePassword)
            });
            const data = await res.json();
            if (data.message) {
                setChangePassword({ oldPassword: '', newPassword: '' });
                setError('');
                alert('Пароль изменён');
            } else {
                setError(data.error || 'Ошибка смены пароля');
            }
        } catch (err) {
            setError('Ошибка соединения с сервером');
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/auth/create-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newAdmin)
            });
            const data = await res.json();
            if (data.message) {
                setAdmins([...admins, { email: newAdmin.email }]);
                setNewAdmin({ email: '', password: '' });
                setError('');
                alert('Админ создан');
            } else {
                setError(data.error || 'Ошибка создания админа');
            }
        } catch (err) {
            setError('Ошибка соединения с сервером');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    };

    const paginate = (items) => {
        const start = (page - 1) * itemsPerPage;
        return items.slice(start, start + itemsPerPage);
    };

    const renderPagination = (items) => {
        const pageCount = Math.ceil(items.length / itemsPerPage);
        if (pageCount <= 1) return null;
        return (
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
                {Array.from({ length: pageCount }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        style={{
                            margin: '0 5px',
                            padding: '5px 10px',
                            background: page === i + 1 ? '#C5E1A5' : '#FFFFFF',
                            border: '1px solid #C5E1A5',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="admin-container">
            <div className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <h2>Панель администратора</h2>
                <button className={activeTab === 'cases' ? 'active' : ''} onClick={() => { setActiveTab('cases'); setSidebarOpen(false); setPage(1); }}>
                    Кейсы
                </button>
                <button className={activeTab === 'tariffs' ? 'active' : ''} onClick={() => { setActiveTab('tariffs'); setSidebarOpen(false); setPage(1); }}>
                    Тарифы
                </button>
                <button className={activeTab === 'team-members' ? 'active' : ''} onClick={() => { setActiveTab('team-members'); setSidebarOpen(false); setPage(1); }}>
                    Команда
                </button>
                <button className={activeTab === 'media' ? 'active' : ''} onClick={() => { setActiveTab('media'); setSidebarOpen(false); setPage(1); }}>
                    СМИ
                </button>
                <button className={activeTab === 'reposts' ? 'active' : ''} onClick={() => { setActiveTab('reposts'); setSidebarOpen(false); setPage(1); }}>
                    Репосты
                </button>
                <button className={activeTab === 'partners' ? 'active' : ''} onClick={() => { setActiveTab('partners'); setSidebarOpen(false); setPage(1); }}>
                    Партнеры
                </button>
                <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => { setActiveTab('orders'); setSidebarOpen(false); setPage(1); }}>
                    Заказы
                </button>
                <button className={activeTab === 'account' ? 'active' : ''} onClick={() => { setActiveTab('account'); setSidebarOpen(false); setPage(1); }}>
                    Аккаунт
                </button>
                <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => { setActiveTab('logs'); setSidebarOpen(false); setPage(1); }}>
                    Логи
                </button>
                <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => { setActiveTab('settings'); setSidebarOpen(false); setPage(1); }}>
                    Настройки
                </button>
                <button onClick={handleLogout}>Выйти</button>
            </div>

            <div className="admin-content">
                <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰ Меню</button>
                {error && <p className="error">{error}</p>}

                {activeTab === 'cases' && (
                    <div>
                        <h2>Кейсы</h2>
                        <form onSubmit={(e) => handleSubmit(e, 'cases', newCase, setNewCase)}>
                            <input type="text" placeholder="Название" value={newCase.title} onChange={(e) => setNewCase({ ...newCase, title: e.target.value })} required />
                            <textarea placeholder="Описание" value={newCase.description} onChange={(e) => setNewCase({ ...newCase, description: e.target.value })} required />
                            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'image', setNewCase)} />
                            <input type="file" accept=".pdf" onChange={(e) => handleImageChange(e, 'pdf', setNewCase)} />
                            {previewImage && <img src={previewImage} alt="Preview" className="preview" />}
                            <button type="submit">Добавить кейс</button>
                        </form>
                        <div className="cases-list">
                            {paginate(cases).map(c => (
                                <div
                                    key={c._id}
                                    className="case-card"
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', c._id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handleDragEnd(e.dataTransfer.getData('text/plain'), c._id, 'cases', cases, setCases);
                                    }}
                                >
                                    <h3>{c.title}</h3>
                                    <p>{c.description}</p>
                                    {c.image && <img src={`http://localhost:5000${c.image}`} alt={c.title} />}
                                    <button onClick={() => setNewCase(c)}>Редактировать</button>
                                    <button className="delete" onClick={() => handleDelete('cases', c._id)}>Удалить</button>
                                    <button className="toggle-visibility" onClick={() => handleToggleVisibility('cases', c._id, c.isVisible)}>
                                    {c.isVisible ? 'Скрыть' : 'Показать'}
                                </button>
                            </div>
                        ))}
                        </div>
                        {renderPagination(cases)}
                    </div>
                )}

                {activeTab === 'tariffs' && (
                    <div>
                        <h2>Тарифы</h2>
                        <form onSubmit={(e) => handleSubmit(e, 'tariffs', newTariff, setNewTariff)}>
                            <input type="text" placeholder="Название" value={newTariff.title} onChange={(e) => setNewTariff({ ...newTariff, title: e.target.value })} required />
                            <textarea placeholder="Краткое описание" value={newTariff.shortDescription} onChange={(e) => setNewTariff({ ...newTariff, shortDescription: e.target.value })} required />
                            <textarea placeholder="Полное описание" value={newTariff.fullDescription} onChange={(e) => setNewTariff({ ...newTariff, fullDescription: e.target.value })} />
                            <textarea placeholder="Особенности (через запятую)" value={newTariff.features.join(',')} onChange={(e) => setNewTariff({ ...newTariff, features: e.target.value.split(',').map(f => f.trim()) })} />
                            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'image', setNewTariff)} />
                            <label>
                                <input type="checkbox" checked={newTariff.isVisible} onChange={(e) => setNewTariff({ ...newTariff, isVisible: e.target.checked })} />
                                Показать на сайте
                            </label>
                            {previewImage && <img src={previewImage} alt="Preview" className="preview" />}
                            <button type="submit">{newTariff._id ? 'Обновить тариф' : 'Добавить тариф'}</button>
                        </form>
                        <div className="tariffs-list">
                            {paginate(tariffs).map(t => (
                                <div key={t._id} className="tariff-item">
                                    <h3>{t.title}</h3>
                                    <p>{t.shortDescription}</p>
                                    {t.image && <img src={`http://localhost:5000${t.image}`} alt={t.title} />}
                                    <button onClick={() => setNewTariff(t)}>Редактировать</button>
                                    <button className="delete" onClick={() => handleDelete('tariffs', t._id)}>Удалить</button>
                                    <button className="toggle-visibility" onClick={() => handleToggleVisibility('tariffs', t._id, t.isVisible)}>
                                        {t.isVisible ? 'Скрыть' : 'Показать'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        {renderPagination(tariffs)}
                    </div>
                )}

                {activeTab === 'team-members' && (
                    <div>
                        <h2>Команда</h2>
                        <form onSubmit={(e) => handleSubmit(e, 'team-members', newTeamMember, setNewTeamMember)}>
                            <input type="text" placeholder="Имя" value={newTeamMember.name} onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })} required />
                            <textarea placeholder="Описание" value={newTeamMember.description} onChange={(e) => setNewTeamMember({ ...newTeamMember, description: e.target.value })} required />
                            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'image', setNewTeamMember)} />
                            <input type="number" placeholder="Порядок" value={newTeamMember.order} onChange={(e) => setNewTeamMember({ ...newTeamMember, order: parseInt(e.target.value) || 0 })} />
                            {previewImage && <img src={previewImage} alt="Preview" className="preview" />}
                            <button type="submit">{newTeamMember._id ? 'Обновить' : 'Добавить'}</button>
                        </form>
                        <div className="team-members-list">
                            {paginate(teamMembers).map(tm => (
                                <div
                                    key={tm._id}
                                    className="team-member-item"
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', tm._id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handleDragEnd(e.dataTransfer.getData('text/plain'), tm._id, 'team-members', teamMembers, setTeamMembers);
                                    }}
                                >
                                    <h3>{tm.name}</h3>
                                    <p>{tm.description}</p>
                                    {tm.image && <img src={`http://localhost:5000${tm.image}`} alt={tm.name} />}
                                    <button onClick={() => setNewTeamMember(tm)}>Редактировать</button>
                                    <button className="delete" onClick={() => handleDelete('team-members', tm._id)}>Удалить</button>
                                    <button className="toggle-visibility" onClick={() => handleToggleVisibility('team-members', tm._id, tm.isVisible)}>
                                        {tm.isVisible ? 'Скрыть' : 'Показать'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        {renderPagination(teamMembers)}
                    </div>
                )}

                {activeTab === 'media' && (
                    <div>
                        <h2>СМИ</h2>
                        <form onSubmit={(e) => handleSubmit(e, 'media', newMedia, setNewMedia)}>
                            <input type="text" placeholder="Название" value={newMedia.title} onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })} required />
                            <textarea placeholder="Описание" value={newMedia.description} onChange={(e) => setNewMedia({ ...newMedia, description: e.target.value })} required />
                            <input type="url" placeholder="Ссылка" value={newMedia.link} onChange={(e) => setNewMedia({ ...newMedia, link: e.target.value })} />
                            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'image', setNewMedia)} />
                            {previewImage && <img src={previewImage} alt="Preview" className="preview" />}
                            <button type="submit">{newMedia._id ? 'Обновить' : 'Добавить'}</button>
                        </form>
                        <div className="media-list">
                            {paginate(mediaItems).map(m => (
                                <div
                                    key={m._id}
                                    className="media-item"
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', m._id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handleDragEnd(e.dataTransfer.getData('text/plain'), m._id, 'media', mediaItems, setMediaItems);
                                    }}
                                >
                                    <h3>{m.title}</h3>
                                    <p>{m.description}</p>
                                    {m.link && <a href={m.link} target="_blank">Ссылка</a>}
                                    {m.image && <img src={`http://localhost:5000${m.image}`} alt={m.title} />}
                                    <button onClick={() => setNewMedia(m)}>Редактировать</button>
                                    <button className="delete" onClick={() => handleDelete('media', m._id)}>Удалить</button>
                                    <button className="toggle-visibility" onClick={() => handleToggleVisibility('media', m._id, m.isVisible)}>
                                        {m.isVisible ? 'Скрыть' : 'Показать'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        {renderPagination(mediaItems)}
                    </div>
                )}

                {activeTab === 'reposts' && (
                    <div>
                        <h2>Репосты</h2>
                        <form onSubmit={(e) => handleSubmit(e, 'reposts', newRepost, setNewRepost)}>
                            <input type="text" placeholder="Название" value={newRepost.title} onChange={(e) => setNewRepost({ ...newRepost, title: e.target.value })} required />
                            <textarea placeholder="Описание" value={newRepost.description} onChange={(e) => setNewRepost({ ...newRepost, description: e.target.value })} required />
                            <input type="url" placeholder="Ссылка" value={newRepost.link} onChange={(e) => setNewRepost({ ...newRepost, link: e.target.value })} />
                            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'image', setNewRepost)} />
                            {previewImage && <img src={previewImage} alt="Preview" className="preview" />}
                            <button type="submit">{newRepost._id ? 'Обновить' : 'Добавить'}</button>
                        </form>
                        <div className="reposts-list">
                            {paginate(reposts).map(r => (
                                <div
                                    key={r._id}
                                    className="repost-item"
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', r._id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handleDragEnd(e.dataTransfer.getData('text/plain'), r._id, 'reposts', reposts, setReposts);
                                    }}
                                >
                                    <h3>{r.title}</h3>
                                    <p>{r.description}</p>
                                    {r.link && <a href={r.link} target="_blank">Ссылка</a>}
                                    {r.image && <img src={`http://localhost:5000${r.image}`} alt={r.title} />}
                                    <button onClick={() => setNewRepost(r)}>Редактировать</button>
                                    <button className="delete" onClick={() => handleDelete('reposts', r._id)}>Удалить</button>
                                    <button className="toggle-visibility" onClick={() => handleToggleVisibility('reposts', r._id, r.isVisible)}>
                                        {r.isVisible ? 'Скрыть' : 'Показать'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        {renderPagination(reposts)}
                    </div>
                )}

                {activeTab === 'partners' && (
                    <div>
                        <h2>Партнеры</h2>
                        <form onSubmit={(e) => handleSubmit(e, 'partners', newPartner, setNewPartner)}>
                            <input type="text" placeholder="Название" value={newPartner.name} onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })} required />
                            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'image', setNewPartner)} />
                            {previewImage && <img src={previewImage} alt="Preview" className="preview" />}
                            <button type="submit">{newPartner._id ? 'Обновить' : 'Добавить'}</button>
                        </form>
                        <div className="partners-list">
                            {paginate(partners).map(p => (
                                <div key={p._id} className="partner-item">
                                    <h3>{p.name}</h3>
                                    {p.image && <img src={`http://localhost:5000${p.image}`} alt={p.name} />}
                                    <button onClick={() => setNewPartner(p)}>Редактировать</button>
                                    <button className="delete" onClick={() => handleDelete('partners', p._id)}>Удалить</button>
                                </div>
                            ))}
                        </div>
                        {renderPagination(partners)}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div>
                        <h2>Заказы</h2>
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Имя</th>
                                    <th>Email</th>
                                    <th>Телефон</th>
                                    <th>Telegram</th>
                                    <th>Тариф</th>
                                    <th>Описание</th>
                                    <th>Дата</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginate(orders).map(o => (
                                    <tr key={o._id}>
                                        <td>{o.name}</td>
                                        <td>{o.email}</td>
                                        <td>{o.phone || '-'}</td>
                                        <td>{o.telegram || '-'}</td>
                                        <td>{o.tariff || '-'}</td>
                                        <td>{o.description || '-'}</td>
                                        <td>{new Date(o.createdAt).toLocaleString()}</td>
                                        <td>
                                            <button className="delete" onClick={() => handleDelete('orders', o._id)}>Удалить</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {renderPagination(orders)}
                    </div>
                )}

                {activeTab === 'account' && (
                    <div>
                        <h2>Управление аккаунтом</h2>
                        <form onSubmit={handleChangePassword}>
                            <input
                                type="password"
                                placeholder="Старый пароль"
                                value={changePassword.oldPassword}
                                onChange={(e) => setChangePassword({ ...changePassword, oldPassword: e.target.value })}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Новый пароль"
                                value={changePassword.newPassword}
                                onChange={(e) => setChangePassword({ ...changePassword, newPassword: e.target.value })}
                                required
                            />
                            <button type="submit">Сменить пароль</button>
                        </form>
                        <h2 style={{ marginTop: '20px' }}>Создать нового админа</h2>
                        <form onSubmit={handleCreateAdmin}>
                            <input
                                type="email"
                                placeholder="Email"
                                value={newAdmin.email}
                                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Пароль"
                                value={newAdmin.password}
                                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                required
                            />
                            <button type="submit">Создать админа</button>
                        </form>
                        <h2 style={{ marginTop: '20px' }}>Список админов</h2>
                        <table className="admins-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginate(admins).map(a => (
                                    <tr key={a._id}>
                                        <td>{a.email}</td>
                                        <td>
                                            <button className="delete" onClick={() => handleDelete('auth/admins', a._id)}>Удалить</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {renderPagination(admins)}
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div>
                        <h2>Логи</h2>
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th>Админ</th>
                                    <th>Действие</th>
                                    <th>Дата</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginate(logs).map(l => (
                                    <tr key={l._id}>
                                        <td>{l.adminEmail}</td>
                                        <td>{l.action}</td>
                                        <td>{new Date(l.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {renderPagination(logs)}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div>
                        <h2>Настройки сайта</h2>
                        <form onSubmit={handleSettings}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.bannerEnabled}
                                    onChange={(e) => setSettings({ ...settings, bannerEnabled: e.target.checked })}
                                />
                                Включить баннер
                            </label>
                            <input
                                type="text"
                                placeholder="Текст баннера"
                                value={settings.bannerText}
                                onChange={(e) => setSettings({ ...settings, bannerText: e.target.value })}
                            />
                            <input
                                type="color"
                                value={settings.bannerColor}
                                onChange={(e) => setSettings({ ...settings, bannerColor: e.target.value })}
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setSettings({ ...settings, bannerImage: file });
                                        const reader = new FileReader();
                                        reader.onloadend = () => setPreviewImage(reader.result);
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            <input
                                type="text"
                                placeholder="URL видео"
                                value={settings.videoUrl}
                                onChange={(e) => setSettings({ ...settings, videoUrl: e.target.value })}
                            />
                            {previewImage && <img src={previewImage} alt="Preview" className="preview" />}
                            <button type="submit">Сохранить настройки</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

ReactDOM.render(<AdminPanel />, document.getElementById('root'));