/**
 * Real Habit Tracker Service for CareerOS
 * Computes active placement streaks and 7-day weekly activity grid
 * from actual user events (applications, skills, simulations, interviews, logins).
 */

export const habitTrackerService = {
    /**
     * Records an activity for today
     */
    recordActivity(userId, activityName = 'visit') {
        if (!userId) return;
        try {
            const todayStr = new Date().toISOString().slice(0, 10);
            const key = `careeros_activity_dates_${userId}`;
            const stored = JSON.parse(localStorage.getItem(key) || '[]');
            
            const existing = stored.find(item => item.date === todayStr);
            if (!existing) {
                stored.push({
                    date: todayStr,
                    activities: [activityName],
                    timestamp: Date.now()
                });
            } else if (!existing.activities.includes(activityName)) {
                existing.activities.push(activityName);
            }

            localStorage.setItem(key, JSON.stringify(stored));
        } catch (e) {
            console.warn('Failed to record activity in habit tracker:', e);
        }
    },

    /**
     * Calculates the real weekly habit matrix (Mon - Sun of current week)
     * and real active consecutive day streak.
     */
    getWeeklyHabitStatus(userId, extraSources = {}) {
        const { applications = [], userSkills = [] } = extraSources;

        // Ensure today is registered
        if (userId) {
            this.recordActivity(userId, 'platform_session');
        }

        // 1. Collect all unique active YYYY-MM-DD date strings
        const activeDates = new Set();
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        activeDates.add(todayStr); // Active today by virtue of dashboard access

        // Read stored activity dates with validation
        if (userId) {
            try {
                const stored = JSON.parse(localStorage.getItem(`careeros_activity_dates_${userId}`) || '[]');
                if (Array.isArray(stored)) {
                    stored.forEach(item => {
                        // Anti-abuse: Only accept valid YYYY-MM-DD dates in the past or present
                        if (typeof item?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && item.date <= todayStr) {
                            activeDates.add(item.date);
                        }
                    });
                }
            } catch {}
        }

        // Add application dates
        applications.forEach(app => {
            const raw = app.applied_at || app.created_at;
            if (raw) {
                try {
                    activeDates.add(new Date(raw).toISOString().slice(0, 10));
                } catch {}
            }
        });

        // Add skill creation dates
        userSkills.forEach(s => {
            const raw = s.created_at;
            if (raw) {
                try {
                    activeDates.add(new Date(raw).toISOString().slice(0, 10));
                } catch {}
            }
        });

        // 2. Compute 7 days of the CURRENT week (Mon through Sun)
        const currentDayIndex = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
        const monday = new Date(today);
        monday.setDate(today.getDate() - currentDayIndex);

        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weekDays = [];

        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateStr = d.toISOString().slice(0, 10);
            const isToday = dateStr === todayStr;
            const isFuture = d > today && !isToday;
            const isCompleted = activeDates.has(dateStr);

            weekDays.push({
                day: dayNames[i],
                dateStr,
                completed: isCompleted,
                today: isToday,
                future: isFuture
            });
        }

        // 3. Calculate real consecutive day streak ending today (bounded to 365 days max)
        let streak = 0;
        let checkDate = new Date(today);

        while (streak < 365) {
            const checkStr = checkDate.toISOString().slice(0, 10);
            if (activeDates.has(checkStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Minimum encouraging streak for active user is at least 1 day
        const displayStreak = Math.max(1, streak);

        return {
            streak: displayStreak,
            weekDays,
            activeCountThisWeek: weekDays.filter(w => w.completed).length,
            isCompletedToday: activeDates.has(todayStr)
        };
    }
};
