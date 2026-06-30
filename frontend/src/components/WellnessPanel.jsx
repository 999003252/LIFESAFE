import "./WellnessPanel.css";

export default function WellnessPanel({ friend }) {

  return (
    <div className="wellness-panel">

      <h2>Wellness</h2>

      <div className="wellness-card">

        <h3>🔥 Support Streak</h3>

        <p className="large-text">5 Days</p>

        <span>Keep supporting your friends!</span>

      </div>

      <div className="wellness-card">

        <h3>💬 Conversation Tip</h3>

        <p>
          Ask open-ended questions.
          They encourage deeper
          conversations than simple
          yes or no questions.
        </p>

      </div>

      <div className="wellness-card">

        <h3>❤️ Wellness Tip</h3>

        <p>
          Take a moment today to
          remind someone that
          you're thinking about them.
        </p>

      </div>

      <div className="wellness-card">

        <h3>🔔 Reminder</h3>

        <p>

          {friend} hasn't checked in
          for 3 days.

        </p>

      </div>

    </div>
  );

}