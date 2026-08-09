import unittest
from unittest.mock import MagicMock, patch

from routers import entries


def journal_entry(**overrides):
    values = {
        "userId": "Leo@Example.com",
        "mood": "sad",
        "moodLabel": "Sad",
        "moodIcon": "sentiment_dissatisfied",
        "answers": ["Private answer", "Another private answer", "Still private"],
        "shareWithFriends": False,
        "shareMessage": "",
        "wantsCheckIn": False,
    }
    values.update(overrides)
    return entries.JournalEntryIn(**values)


class SocialCheckInTests(unittest.TestCase):
    def test_social_fields_default_to_private(self):
        entry = journal_entry()

        self.assertFalse(entry.shareWithFriends)
        self.assertEqual(entry.shareMessage, "")
        self.assertFalse(entry.wantsCheckIn)

    def test_shared_snapshot_never_contains_private_answers(self):
        entry = journal_entry(
            shareWithFriends=True,
            shareMessage="  I could use some company.  ",
            wantsCheckIn=True,
        )

        snapshot = entries._shared_check_in(entry, "entry-1", "2026-08-09T12:00:00+00:00")

        self.assertNotIn("answers", snapshot)
        self.assertEqual(snapshot["message"], "I could use some company.")
        self.assertTrue(snapshot["wantsCheckIn"])

    @patch.object(entries, "_friend_ids", return_value=["friend@example.com"])
    @patch.object(entries, "FRIENDSHIPS_TABLE")
    def test_shared_check_in_is_written_to_the_reciprocal_friend_record(
        self, friendships_table, _friend_ids
    ):
        entry = journal_entry(shareWithFriends=True, wantsCheckIn=True)

        entries.publish_shared_check_in(
            entry, "entry-1", "2026-08-09T12:00:00+00:00"
        )

        friendships_table.update_item.assert_called_once()
        call = friendships_table.update_item.call_args.kwargs
        self.assertEqual(
            call["Key"],
            {"userId": "friend@example.com", "friendId": "leo@example.com"},
        )
        self.assertTrue(call["ExpressionAttributeValues"][":unread"])

    @patch.object(entries, "publish_shared_check_in")
    @patch.object(entries, "table")
    def test_private_entry_does_not_publish_a_social_check_in(
        self, table, publish_shared_check_in
    ):
        table.put_item = MagicMock()

        saved = entries.create_entry(
            journal_entry(wantsCheckIn=True, shareMessage="Do not share this")
        )

        publish_shared_check_in.assert_not_called()
        self.assertFalse(saved["shareWithFriends"])
        self.assertFalse(saved["wantsCheckIn"])

    @patch.object(entries, "publish_shared_check_in")
    @patch.object(entries, "table")
    def test_shared_entry_publishes_after_it_is_saved(
        self, table, publish_shared_check_in
    ):
        table.put_item = MagicMock()
        entry = journal_entry(
            shareWithFriends=True,
            shareMessage="Please reach out",
            wantsCheckIn=True,
        )

        saved = entries.create_entry(entry)

        publish_shared_check_in.assert_called_once_with(
            entry, saved["entryId"], saved["timestamp"]
        )


if __name__ == "__main__":
    unittest.main()
