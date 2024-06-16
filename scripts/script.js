document.addEventListener("DOMContentLoaded", function() {
    const filmsContainer = document.querySelector(".all-films");
    const modalContainer = document.querySelector(".modal-box");
    const modal = document.querySelector('.modal');
    const sessionModal = document.querySelector('.modal_session');
    const seatMap = document.querySelector(".seat-map");
    const seatContainer = document.querySelector(".seat-container");
    let selectedSeats = 0;
    let filmId = null;
    let reserveButton = null;

    let users = {};
    document.querySelector('.close-button_auth').addEventListener('click', function() {
        document.querySelector('.modal_auth').classList.add('hidden');
    });
    fetch("http://localhost:3000/api/users")
        .then(response => response.json())
        .then(data => {
        users = data;
        
    })
    .catch(error => console.error("Error fetching user data:", error));
    fetch("http://localhost:3000/api/films/")
        .then(response => response.json())
        .then(filmData => {
            filmData.forEach((movie, index) => {
                const filmElement = document.createElement("div");
                filmElement.classList.add("film");
                filmElement.innerHTML = `
                    <a href="#" class="poster-link" data-film-id="${movie.film_id}">
                        <div class="poster-map">
                            <img src="${movie.poster_path}" alt="poster" class="poster-image">
                            <div class="poster-details">
                                <h3 class="film-title">${movie.title}</h3>
                                <p class="film-age">${movie.age_rating}</p>
                            </div>
                        </div>
                    </a>
                `;
                filmsContainer.appendChild(filmElement);
            });

            const posters = document.querySelectorAll('.poster-link');
            posters.forEach(poster => {
                poster.addEventListener('click', function(event) {
                    event.preventDefault();
                    filmId = parseInt(poster.getAttribute('data-film-id'));
                    const selectedFilm = filmData.find(film => film.film_id === filmId);
                    modalContainer.innerHTML = `
                        <div class="poster">
                            <button class="close-button">&times;</button>
                            <div class="about-film-top">
                                <h2>${selectedFilm.title}</h2>
                            </div>
                            <div class="body-modal">
                                <div class="video-container">
                                    <iframe width="560" height="315" src="${selectedFilm.trailer_url}" 
                                        title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
                                    </iframe>
                                </div>
                            </div>
                            <p class="description">
                                ${selectedFilm.description}
                            </p>
                            <div class="footer-modal">
                                <h6>Доступные сеансы</h6>
                                <div class="session-dates"></div>
                                <div class="session-times"></div>
                            </div>
                        </div>
                    `;
                    modal.classList.add('open');

                    const closeButton = document.querySelector('.close-button');
                    closeButton.addEventListener('click', function() {
                        modal.classList.remove('open');
                        selectedSeats = 0; 
                        const activeSeats = document.querySelectorAll('.seat.active');
                        activeSeats.forEach(seat => {
                            seat.classList.remove('active');
                        });
                    });
                    
                    fetch(`http://localhost:3000/api/sessions?film_id=${filmId}`)
                        .then(response => response.json())
                        .then(sessionData => {
                            const sessionDatesContainer = modalContainer.querySelector('.session-dates');
                            const uniqueDates = [...new Set(sessionData.map(session => new Date(session.time).toLocaleDateString()))];
                            sessionDatesContainer.innerHTML = uniqueDates.map(date => `<button class="session-date">${date}</button>`).join('');

                            const sessionDates = modalContainer.querySelectorAll('.session-date');
                            sessionDates.forEach(date => {
                                date.addEventListener('click', function() {
                                    const selectedDate = modalContainer.querySelector('.selected');
                                    if (selectedDate) {
                                        selectedDate.classList.remove('selected');
                                    }
                                    date.classList.add('selected');

                                    const selectedDateValue = date.textContent;
                                    const sessionsForDate = sessionData.filter(session => new Date(session.time).toLocaleDateString() === selectedDateValue && session.film_id === filmId);
                                    const sessionTimesContainer = modalContainer.querySelector('.session-times');
                                    sessionTimesContainer.innerHTML = '';
                                    const sessionTimesHTML = sessionsForDate.map(session => {
                                        const sessionTime = new Date(session.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        return `<button class="session-button" data-hall="${session.hall_id}" data-time="${session.time}" data-session-id="${session.session_id}" data-film-title="${session.film_title}">${sessionTime}</button>`;
                                    }).join('');
                                    
                                    sessionTimesContainer.innerHTML = sessionTimesHTML;

                                    const newSessionButtons = sessionTimesContainer.querySelectorAll('.session-button');
                                    newSessionButtons.forEach(button => {
                                        button.addEventListener('click', function() {
                                            const username = prompt("Пожалуйста, введите ваш логин:");
                                            if(username) {
                                                
                                                if (!users[username]) {
                                                    alert("Пользователь не найден!");
                                                    return;
                                                }

                                                console.log("Зал:", button.getAttribute('data-hall'));
                                                console.log("Время:", button.getAttribute('data-time'));
                                                console.log("Название:", button.getAttribute('data-film-title'));
                                                const filmTitle = button.getAttribute('data-film-title');
                                                const sessionTime= button.getAttribute('data-time');
                                                const sessionId = button.getAttribute('data-session-id');
                                                
                                                sessionModal.classList.add('open');
                                                const sessionModalCloseButton = sessionModal.querySelector('.close-button');
                                                sessionModalCloseButton.addEventListener('click', function() {
                                                    sessionModal.classList.remove('open');
                                                    selectedSeats = 0; 
                                                    const activeSeats = document.querySelectorAll('.seat.active');
                                                    activeSeats.forEach(seat => {
                                                        seat.classList.remove('active');
                                                    });
                                                });
                                    
                                                reserveButton = document.createElement('button');
                                                reserveButton.textContent = 'Забронировать';
                                                reserveButton.classList.add('reserve-button');
                                                reserveButton.addEventListener('click', function() {
                                                    reserveSeat(filmTitle, sessionTime, sessionId, username);
                                                });
                                                const oldReserveButton = sessionModal.querySelector('.reserve-button');
                                                if (oldReserveButton) {
                                                    oldReserveButton.parentNode.replaceChild(reserveButton, oldReserveButton);
                                                } else {
                                                    sessionModal.appendChild(reserveButton);
                                                }
                                    
                                                
                                                fetch(`http://localhost:3000/api/hall/${button.getAttribute('data-hall')}`)
                                                    .then(response => response.json())
                                                    .then(hallData => {
                                                        const hallInfo = hallData[0];
                                                        const rowsCount = hallInfo.rows_count;
                                                        button.setAttribute('data-rows', rowsCount);  
                                                                                         
                                                        fetchForSeats(sessionId, rowsCount);
                                                    })
                                                    .catch(error => console.error('Error fetching hall data:', error));
                                            } else {
                                                alert("Вы не ввели логин!");
                                            }
                                        });
                                    });
                                });
                            });
                        })
                        .catch(error => console.error("Error fetching session data:", error));
                });
            });
        })
        .catch(error => console.error("Error fetching film data:", error));

    // document.addEventListener('keydown', function(event) {
    //     if (event.key === 'Escape' && modal.classList.contains('open')) {
    //         modal.classList.remove('open');
    //     }
    ;

    function fetchForSeats(sessionId, rowsCount) {
        seatContainer.innerHTML = '';
        const hallContainer = document.createElement("div");
        hallContainer.classList.add("hall");
        for (let i = 1; i <= rowsCount; i++) {
            const rowContainer = document.createElement("div");
            rowContainer.classList.add("row-container");
            hallContainer.appendChild(rowContainer);
    
            const rowNumber = document.createElement("div");
            rowNumber.classList.add("rows-item");
            if (i === 1) {
                rowNumber.classList.add("first");
            }
            rowNumber.textContent = `Ряд ${i}`;
            rowContainer.appendChild(rowNumber);
        }
        seatContainer.appendChild(hallContainer);
    
        fetch(`http://localhost:3000/api/reservation?session_id=${sessionId}`)
            .then(response => response.json())
            .then(data => {
                const hallSeats = data || [];
                seatMap.innerHTML = '';
                const seatsInRow = 16;
                for (let i = 1; i <= rowsCount; i++) {
                    const rowElement = document.createElement("div");
                    rowElement.classList.add("row");
                    rowElement.setAttribute("row", i);
                    for (let j = 1; j <= seatsInRow; j++) {
                        const seatElement = document.createElement("div");
                        seatElement.classList.add("seat");
                        seatElement.setAttribute("row", i);
                        seatElement.setAttribute("place", j);
                        const isReserved = hallSeats.some(reservedSeat => {
                            return reservedSeat.row_number === i && reservedSeat.seat_number === j && reservedSeat.session_id === parseInt(sessionId);
                        });
                        if (isReserved) {
                            seatElement.classList.add("reserve");
                        }
                        const seatNumberSpan = document.createElement("span");
                        seatNumberSpan.textContent = j;
                        seatElement.appendChild(seatNumberSpan);
                        rowElement.appendChild(seatElement);
    
                        seatElement.addEventListener("click", function() {
                            if (!this.classList.contains("reserve")) {
                                if (this.classList.toggle("active")) {
                                    selectedSeats++;
                                    if (selectedSeats > 5) {
                                        alert("Максимум 5");
                                        this.classList.remove("active");
                                        selectedSeats--;
                                    }
                                } else {
                                    selectedSeats--;
                                }
                            }
                        });
                    }
                    seatMap.appendChild(rowElement);
                }
            })
            .catch(error => {
                console.error('Error fetching reservation data:', error);
            });
    }
    
    async function reserveSeat(filmTitle, sessionTime, sessionId, username) {
        try {
            const formatTime = (time) => {
                const date = new Date(time);
                const options = { day: 'numeric', month: 'numeric', hour: 'numeric', minute: 'numeric' };
                return date.toLocaleDateString('ru-RU', options);
            };
            const selectedSeats = document.querySelectorAll(".seat.active");
            if (selectedSeats.length === 0) {
                alert('Выберите места');
                return;
            }
            const reservedSeatsInfo = Array.from(selectedSeats).map(seat => {
                return {
                    rowNumber: parseInt(seat.getAttribute('row')),
                    seatNumber: parseInt(seat.getAttribute('place'))
                };
            });
            const reserveSeatPromises = reservedSeatsInfo.map(async seat => {
                try {
                    const response = await fetch('http://localhost:3000/api/reservation/add', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            session_id: sessionId,
                            row_number: seat.rowNumber,
                            seat_number: seat.seatNumber,
                            username: username 
                        })
                    });
    
                    if (!response.ok) {
                        throw new Error('Ошибка при резервировании мест: ' + response.statusText);
                    }
                } catch (error) {
                    console.error('Ошибка при резервировании мест:', error.message);
                    throw error;
                }
            });
    
            await Promise.all(reserveSeatPromises);
    
            const reservationDetails = {
                filmTitle,
                sessionTime: formatTime(sessionTime),
                seats: reservedSeatsInfo,
                username
            };
    
            await fetch('http://localhost:3000/api/sendReservation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reservationDetails)
            });
    
            const modalCheckContainer = document.querySelector(".modal-box_check");
            const modalCheck = document.querySelector('.modal_check');
    
            const filmTitleElement = modalCheckContainer.querySelector('.film-title');
            const sessionTimeElement = modalCheckContainer.querySelector('.session-time');
            const reservedSeatsList = modalCheckContainer.querySelector('.reserved-seats');
    
            filmTitleElement.textContent = filmTitle;
            sessionTimeElement.textContent = formatTime(sessionTime);
            reservedSeatsList.innerHTML = '';
    
            reservedSeatsInfo.forEach(seat => {
                const seatElement = document.querySelector(`.seat[row="${seat.rowNumber}"][place="${seat.seatNumber}"]`);
                seatElement.classList.add('reserve'); 
                seatElement.classList.remove('active');
                const seatItem = document.createElement('li');
                seatItem.textContent = `(Ряд ${seat.rowNumber}, Место ${seat.seatNumber})`;
                reservedSeatsList.appendChild(seatItem);
            });
    
            modalCheck.classList.add('open');
    
            const closeButtonCheck = document.querySelector('.close-button_check');
            closeButtonCheck.addEventListener('click', function () {
                modalCheck.classList.remove('open');
            });
    
        } catch (error) {
            console.error('Ошибка при выполнении запроса:', error);
            alert('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
        }
    }
});
