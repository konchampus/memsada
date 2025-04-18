const { useState, useEffect } = React;

function App() {
    const [cases, setCases] = useState([]);
    const [settings, setSettings] = useState({ bannerEnabled: false, bannerText: '', bannerColor: '', bannerImage: '', videoUrl: '/assets/demo.mp4' });
    const [tariffs, setTariffs] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [mediaItems, setMediaItems] = useState([]);
    const [reposts, setReposts] = useState([]);
    const [partners, setPartners] = useState([]);
    const [error, setError] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [isMobile, setIsMobile] = useState(window.matchMedia("(max-width: 640px)").matches);
    const [selectedImage, setSelectedImage] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [selectedTariff, setSelectedTariff] = useState(null);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isBannerVisible, setIsBannerVisible] = useState(true);

    useEffect(() => {
        const fetchData = async (url, setter, errorMsg) => {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
                const data = await res.json();
                setter(data);
            } catch (err) {
                setError(`${errorMsg}: ${err.message}`);
            }
        };

        fetchData('http://localhost:5000/api/cases', setCases, 'Не удалось загрузить кейсы');
        fetchData('http://localhost:5000/api/settings', setSettings, 'Не удалось загрузить настройки');
        fetchData('http://localhost:5000/api/tariffs', setTariffs, 'Не удалось загрузить тарифы');
        fetchData('http://localhost:5000/api/team-members', setTeamMembers, 'Не удалось загрузить данные команды');
        fetchData('http://localhost:5000/api/media', setMediaItems, 'Не удалось загрузить данные СМИ');
        fetchData('http://localhost:5000/api/reposts', setReposts, 'Не удалось загрузить данные репостов');
        fetchData('http://localhost:5000/api/partners', setPartners, 'Не удалось загрузить данные партнеров');

        const popupInterval = setInterval(() => {
            setShowPopup(true);
        }, 60000);

        const mediaQuery = window.matchMedia("(max-width: 640px)");
        const handleMediaChange = (e) => setIsMobile(e.matches);
        mediaQuery.addListener(handleMediaChange);

        return () => {
            clearInterval(popupInterval);
            mediaQuery.removeListener(handleMediaChange);
        };
    }, []);

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            const res = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('name'),
                    phone: formData.get('phone') || '',
                    telegram: formData.get('telegram') || '',
                    email: formData.get('email'),
                    description: formData.get('description') || ''
                })
            });
            if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
            const data = await res.json();
            alert(data.message);
            e.target.reset();
            setShowPopup(false);
        } catch (err) {
            alert(`Ошибка отправки заявки: ${err.message}`);
        }
    };

    const handleTariffOrderSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            const res = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: '',
                    tariff: selectedTariff.title
                })
            });
            if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
            const data = await res.json();
            alert(data.message);
            e.target.reset();
            setSelectedTariff(null);
        } catch (err) {
            alert(`Ошибка отправки заявки: ${err.message}`);
        }
    };

    const handlePopupClose = () => {
        setShowPopup(false);
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setZoomLevel(1);
    };

    const handleImagePopupClose = () => {
        setSelectedImage(null);
    };

    const handleTariffClick = (tariff) => {
        setSelectedTariff(tariff);
    };

    const handleTariffPopupClose = () => {
        setSelectedTariff(null);
    };

    const handleNavLinkClick = () => {
        if (isMobile) {
            setIsNavOpen(false);
        }
    };

    const handleBannerClose = () => {
        setIsBannerVisible(false);
    };

    const tariffOrder = ['Бизнес-пакет', 'Корпоративный пакет', 'Персональный пакет', 'Подписка на мемы'];
    const sortedTariffs = tariffs
        .filter(tariff => tariff.isVisible)
        .sort((a, b) => tariffOrder.indexOf(a.title) - tariffOrder.indexOf(b.title));

    return (
        <div>
            <header>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="assets/logo.png" alt="MemesAgency" />
                        <div>
                            <h1>MemesAgency</h1>
                            <p>Мемы, которые репостит Пригожин и вирусны в СМИ</p>
                        </div>
                    </div>
                    <div className={`hamburger ${isNavOpen ? 'active' : ''}`} onClick={() => setIsNavOpen(!isNavOpen)}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <nav className={isNavOpen ? 'active' : ''}>
                        <a href="#services" onClick={handleNavLinkClick}>Услуги</a>
                        <a href="#portfolio" onClick={handleNavLinkClick}>Портфолио</a>
                        <a href="#team" onClick={handleNavLinkClick}>Команда</a>
                        <a href="#media" onClick={handleNavLinkClick}>СМИ</a>
                        <a href="#reposts" onClick={handleNavLinkClick}>Репосты</a>
                        <a href="#order" onClick={handleNavLinkClick}>Контакты</a>
                    </nav>
                </div>
            </header>

            <main>
                <section className="hero">
                    <svg className="arrow left" viewBox="0 0 100 100">
                        <path d="M20 80 Q50 50 80 20" stroke="#C5E1A5" strokeWidth="5" fill="none" />
                        <polygon points="80,20 70,30 90,30" fill="#C5E1A5" />
                    </svg>
                    <h1>Мем-маркетинг</h1>
                    <p>Бизнес-мемы — это не просто смешные картинки. Это продукт, который увеличит вовлечённость в ваших соцсетях, добавит позитива и сделает ваш бренд ближе к сердцу ваших подписчиков.</p>
                    <button onClick={() => setShowPopup(true)}>Заявка на успех</button>
                    <svg className="arrow right" viewBox="0 0 100 100">
                        <path d="M20 80 Q50 50 80 20" stroke="#C5E1A5" strokeWidth="5" fill="none" />
                        <polygon points="80,20 70,30 90,30" fill="#C5E1A5" />
                    </svg>
                </section>

                {settings.bannerEnabled && isBannerVisible && (
                    <div className={`banner ${!isBannerVisible ? 'hidden' : ''}`} style={{ backgroundColor: settings.bannerColor || '#C5E1A5', backgroundImage: settings.bannerImage ? `url(http://localhost:5000${settings.bannerImage})` : 'none' }}>
                        <span>{settings.bannerText || 'Первый заказ — 50% скидка!'}</span>
                        <button className="banner-close" onClick={handleBannerClose}>✕</button>
                    </div>
                )}

                <section>
                    <div className="container">
                        <h2>Первое мем-агентство, которое сделает ваш бренд мемным!</h2>
                        <div className="utp-grid">
                            <div>
                                <img src="assets/prigozhin.jpg" alt="Репост Пригожина" />
                                <p>Наши мемы репостил Иосиф Пригожин</p>
                            </div>
                            <div>
                                <img src="assets/media.png" alt="СМИ" />
                                <p>Публиковались в топовых СМИ</p>
                            </div>
                            <div>
                                <img src="assets/kazakh.png" alt="Казахский депутат" />
                                <p>Помогли казахскому депутату стать мемом и выиграть выборы</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="services" className="tariffs-section">
                    <div className="container">
                        <h2>Услуги</h2>
                        <div className="services-grid">
                            {sortedTariffs.map(tariff => (
                                <div key={tariff._id} className="tariff-card" onClick={() => handleTariffClick(tariff)} style={{ cursor: 'pointer' }}>
                                    <svg className="border" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <path d="M5,5 Q50,0 95,5 Q100,50 95,95 Q50,100 5,95 Q0,50 5,5" />
                                    </svg>
                                    <h3>{tariff.title}</h3>
                                    <p>{tariff.shortDescription}</p>
                                    <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: '10px 0' }}>
                                        {tariff.features.map((feature, index) => (
                                            <li key={index}>{feature}</li>
                                        ))}
                                    </ul>
                                    {tariff.image && <img src={`http://localhost:5000${tariff.image}`} alt={tariff.title} />}
                                    <a href="#order" onClick={(e) => e.stopPropagation()}>Стать мемом 🚀</a>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="trusted">
                    <div className="container">
                        <h2>Нам доверяют (мы и это превратили в мемы!)</h2>
                        <div className="partners">
                            {partners.length === 0 ? (
                                <p>Партнеры пока не добавлены</p>
                            ) : (
                                partners.map(p => (
                                    <img key={p._id} src={`http://localhost:5000${p.image}`} alt={p.name} />
                                ))
                            )}
                        </div>
                    </div>
                </section>

                <section id="portfolio">
                    <div className="container">
                        <h2>Наши кейсы</h2>
                        {error && <p className="error">{error}</p>}
                        <div className="case-slider">
                            {cases.length === 0 ? (
                                <p style={{ textAlign: 'center' }}>Кейсы пока не добавлены</p>
                            ) : (
                                cases.map(c => (
                                    <div key={c._id} className="case-card">
                                        <div>
                                            <h3>{c.title}</h3>
                                            <p>{c.description}</p>
                                            {c.image && (
                                                <img
                                                    src={`http://localhost:5000${c.image}`}
                                                    alt={c.title}
                                                    onClick={() => handleImageClick(`http://localhost:5000${c.image}`)}
                                                />
                                            )}
                                            <button onClick={() => c.pdf ? window.open(`http://localhost:5000${c.pdf}`, '_blank') : alert('PDF недоступен')}>
                                                Посмотреть кейс
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                <section id="video">
                    <div className="container">
                        <h2>Мемы в действии</h2>
                        <div className="video-container">
                            <video controls src={settings.videoUrl} poster="assets/business-meme.jpg">
                                Ваш браузер не поддерживает видео.
                            </video>
                        </div>
                    </div>
                </section>

                <section id="team">
                    <div className="container">
                        <h2>Наша команда</h2>
                        <p>Наша команда — это авторы из 4ch, топовых пабликов и эксперты вирусного контента.</p>
                        {error && <p className="error">{error}</p>}
                        <div className="team">
                            {teamMembers.length === 0 ? (
                                <p style={{ textAlign: 'center' }}>Команда пока не добавлена</p>
                            ) : (
                                teamMembers.map(tm => (
                                    <div key={tm._id}>
                                        {tm.image && <img src={`http://localhost:5000${tm.image}`} alt={tm.name} />}
                                        <h3>{tm.name}</h3>
                                        <p>{tm.description}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                <section id="media">
                    <div className="container">
                        <h2>СМИ о нас</h2>
                        {error && <p className="error">{error}</p>}
                        <div className="partners">
                            {mediaItems.length === 0 ? (
                                <p style={{ textAlign: 'center' }}>СМИ пока не добавлены</p>
                            ) : (
                                mediaItems.map(m => (
                                    <div key={m._id}>
                                        {m.image && <img src={`http://localhost:5000${m.image}`} alt={m.title} />}
                                        <h3>{m.title}</h3>
                                        <p>{m.description}</p>
                                        {m.link && <a href={m.link} target="_blank">Перейти</a>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                <section id="reposts">
                    <div className="container">
                        <h2>Репосты</h2>
                        {error && <p className="error">{error}</p>}
                        <div className="partners">
                            {reposts.length === 0 ? (
                                <p style={{ textAlign: 'center' }}>Репосты пока не добавлены</p>
                            ) : (
                                reposts.map(r => (
                                    <div key={r._id}>
                                        {r.image && <img src={`http://localhost:5000${r.image}`} alt={r.title} />}
                                        <h3>{r.title}</h3>
                                        <p>{r.description}</p>
                                        {r.link && <a href={r.link} target="_blank">Перейти</a>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                <section id="order" style={{ background: '#FFFFFF' }}>
                    <div className="container">
                        <h2>Оставить заявку</h2>
                        <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                            Мы не пилим унылый контент. Мы разрываем ленту! (｡◕‿◕｡)
                        </p>
                        <form onSubmit={handleOrderSubmit}>
                            <input name="name" placeholder="Имя" required />
                            <input name="phone" placeholder="Телефон" />
                            <input name="telegram" placeholder="Telegram" />
                            <input name="email" type="email" placeholder="Email" required />
                            <textarea name="description" placeholder="Комментарий"></textarea>
                            <button type="submit">Shut up and take my money!</button>
                        </form>
                    </div>
                </section>

                <footer id="contacts">
                    <div className="container">
                        <h2>Мы всегда на связи</h2>
                        <p>Email: <a href="mailto:info@memes.ru">info@memes.ru</a></p>
                        <p>Telegram: <a href="https://t.me/memesagency">memesagency</a></p>
                        <div className="partners">
                            {partners.length === 0 ? (
                                <p>Партнеры пока не добавлены</p>
                            ) : (
                                partners.map(p => (
                                    <img key={p._id} src={`http://localhost:5000${p.image}`} alt={p.name} />
                                ))
                            )}
                        </div>
                        <p>© 2025 MemesAgency. Все права защищены.</p>
                    </div>
                </footer>

                <div
                    className={`popup ${showPopup ? 'active' : ''}`}
                    onClick={isMobile ? null : handlePopupClose}
                >
                    <div className="popup-content" onClick={e => e.stopPropagation()}>
                        <button className="popup-close" onClick={handlePopupClose}>
                            ✕
                        </button>
                        <h3>Закажите мем сейчас!</h3>
                        <form onSubmit={handleOrderSubmit}>
                            <input name="name" placeholder="Имя" required />
                            <input name="email" type="email" placeholder="Email" required />
                            <button type="submit">Отправить</button>
                        </form>
                    </div>
                </div>

                {selectedImage && (
                <div
                    className="image-popup active"
                    onClick={isMobile ? null : handleImagePopupClose}
                >
                    <div className="image-popup-content" onClick={e => e.stopPropagation()}>
                        <button className="popup-close" onClick={handleImagePopupClose}>
                            ✕
                        </button>
                        <img
                            src={selectedImage}
                            alt="Zoomed image"
                            style={{ transform: `scale(${zoomLevel})`, cursor: 'zoom-in' }}
                            onClick={() => setZoomLevel(z => Math.min(z + 0.2, 3))}
                            onDoubleClick={() => setZoomLevel(z => Math.max(z - 0.2, 0.5))}
                        />
                    </div>
                </div>
            )}

                {selectedTariff && (
                    <div
                        className="tariff-popup"
                        onClick={isMobile ? null : handleTariffPopupClose}
                    >
                        <div className="popup-content" onClick={e => e.stopPropagation()}>
                            <button className="popup-close" onClick={handleTariffPopupClose}>
                                ✕
                            </button>
                            <div className="popup-left">
                                {selectedTariff.image ? (
                                    <img
                                        src={`http://localhost:5000${selectedTariff.image}`}
                                        alt={selectedTariff.title}
                                        className="popup-image"
                                    />
                                ) : (
                                    <p>Изображение отсутствует</p>
                                )}
                                <div className="popup-text">
                                    <h3>{selectedTariff.title}</h3>
                                    <p>{selectedTariff.fullDescription || 'Описание отсутствует'}</p>
                                </div>
                            </div>
                            <div className="popup-right">
                                <form onSubmit={handleTariffOrderSubmit}>
                                    <input name="name" placeholder="Имя" required />
                                    <input name="email" type="email" placeholder="Email" required />
                                    <textarea name="message" placeholder="Сообщение"></textarea>
                                    <button type="submit">Заказать тариф</button>
                                    <button type="button" onClick={handleTariffPopupClose}>Закрыть</button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));