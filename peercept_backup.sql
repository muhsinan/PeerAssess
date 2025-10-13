--
-- PostgreSQL database dump
--

\restrict ekBDB8b5nfP9sttCj7ncbQzy6jOKOT56NfiLdeGbsHj754CMqwv6mTzfXWLO9Ys

-- Dumped from database version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.10 (Homebrew)

-- Started on 2025-10-13 14:17:04 +03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY peer_assessment.submissions DROP CONSTRAINT submissions_student_id_fkey;
ALTER TABLE ONLY peer_assessment.submissions DROP CONSTRAINT submissions_assignment_id_fkey;
ALTER TABLE ONLY peer_assessment.submission_attachments DROP CONSTRAINT submission_attachments_submission_id_fkey;
ALTER TABLE ONLY peer_assessment.rubric_performance_levels DROP CONSTRAINT rubric_performance_levels_criterion_id_fkey;
ALTER TABLE ONLY peer_assessment.rubric_criteria DROP CONSTRAINT rubric_criteria_rubric_id_fkey;
ALTER TABLE ONLY peer_assessment.pending_enrollment_requests DROP CONSTRAINT pending_enrollment_requests_student_id_fkey;
ALTER TABLE ONLY peer_assessment.pending_enrollment_requests DROP CONSTRAINT pending_enrollment_requests_reviewed_by_fkey;
ALTER TABLE ONLY peer_assessment.pending_enrollment_requests DROP CONSTRAINT pending_enrollment_requests_course_id_fkey;
ALTER TABLE ONLY peer_assessment.peer_reviews DROP CONSTRAINT peer_reviews_submission_id_fkey;
ALTER TABLE ONLY peer_assessment.peer_reviews DROP CONSTRAINT peer_reviews_reviewer_id_fkey;
ALTER TABLE ONLY peer_assessment.peer_reviews DROP CONSTRAINT peer_reviews_generated_by_instructor_fkey;
ALTER TABLE ONLY peer_assessment.peer_review_scores DROP CONSTRAINT peer_review_scores_review_id_fkey;
ALTER TABLE ONLY peer_assessment.peer_review_scores DROP CONSTRAINT peer_review_scores_criterion_id_fkey;
ALTER TABLE ONLY peer_assessment.password_reset_tokens DROP CONSTRAINT password_reset_tokens_user_id_fkey;
ALTER TABLE ONLY peer_assessment.courses DROP CONSTRAINT courses_instructor_id_fkey;
ALTER TABLE ONLY peer_assessment.course_invitations DROP CONSTRAINT course_invitations_invited_by_fkey;
ALTER TABLE ONLY peer_assessment.course_invitations DROP CONSTRAINT course_invitations_course_id_fkey;
ALTER TABLE ONLY peer_assessment.course_enrollments DROP CONSTRAINT course_enrollments_student_id_fkey;
ALTER TABLE ONLY peer_assessment.course_enrollments DROP CONSTRAINT course_enrollments_course_id_fkey;
ALTER TABLE ONLY peer_assessment.chat_messages DROP CONSTRAINT chat_messages_sender_id_fkey;
ALTER TABLE ONLY peer_assessment.chat_messages DROP CONSTRAINT chat_messages_conversation_id_fkey;
ALTER TABLE ONLY peer_assessment.chat_message_read_status DROP CONSTRAINT chat_message_read_status_user_id_fkey;
ALTER TABLE ONLY peer_assessment.chat_message_read_status DROP CONSTRAINT chat_message_read_status_message_id_fkey;
ALTER TABLE ONLY peer_assessment.chat_conversations DROP CONSTRAINT chat_conversations_review_id_fkey;
ALTER TABLE ONLY peer_assessment.chat_conversations DROP CONSTRAINT chat_conversations_participant2_id_fkey;
ALTER TABLE ONLY peer_assessment.chat_conversations DROP CONSTRAINT chat_conversations_participant1_id_fkey;
ALTER TABLE ONLY peer_assessment.assignments DROP CONSTRAINT assignments_course_id_fkey;
ALTER TABLE ONLY peer_assessment.assignment_rubrics DROP CONSTRAINT assignment_rubrics_rubric_id_fkey;
ALTER TABLE ONLY peer_assessment.assignment_rubrics DROP CONSTRAINT assignment_rubrics_assignment_id_fkey;
DROP TRIGGER trigger_update_conversation_last_message ON peer_assessment.chat_messages;
DROP INDEX peer_assessment.idx_submissions_student_id;
DROP INDEX peer_assessment.idx_submissions_has_analysis;
DROP INDEX peer_assessment.idx_submissions_has_aggregated_synthesis;
DROP INDEX peer_assessment.idx_submissions_assignment_id;
DROP INDEX peer_assessment.idx_submission_attachments_submission_id;
DROP INDEX peer_assessment.idx_rubric_performance_levels_order;
DROP INDEX peer_assessment.idx_rubric_performance_levels_criterion_id;
DROP INDEX peer_assessment.idx_pending_enrollment_requests_student_id;
DROP INDEX peer_assessment.idx_pending_enrollment_requests_status;
DROP INDEX peer_assessment.idx_pending_enrollment_requests_requested_at;
DROP INDEX peer_assessment.idx_pending_enrollment_requests_course_id;
DROP INDEX peer_assessment.idx_peer_reviews_submission_id;
DROP INDEX peer_assessment.idx_peer_reviews_reviewer_id;
DROP INDEX peer_assessment.idx_peer_reviews_has_synthesis;
DROP INDEX peer_assessment.idx_peer_reviews_ai_generated;
DROP INDEX peer_assessment.idx_peer_review_scores_review_id;
DROP INDEX peer_assessment.idx_password_reset_tokens_user_id;
DROP INDEX peer_assessment.idx_password_reset_tokens_token;
DROP INDEX peer_assessment.idx_email_verification_token;
DROP INDEX peer_assessment.idx_email_verification_expires;
DROP INDEX peer_assessment.idx_email_verification_email;
DROP INDEX peer_assessment.idx_course_invitations_token;
DROP INDEX peer_assessment.idx_course_invitations_email;
DROP INDEX peer_assessment.idx_course_invitations_course_id;
DROP INDEX peer_assessment.idx_course_enrollments_student_id;
DROP INDEX peer_assessment.idx_course_enrollments_course_id;
DROP INDEX peer_assessment.idx_chat_messages_sent_at;
DROP INDEX peer_assessment.idx_chat_messages_sender_id;
DROP INDEX peer_assessment.idx_chat_messages_conversation_id;
DROP INDEX peer_assessment.idx_chat_message_read_status_user_id;
DROP INDEX peer_assessment.idx_chat_message_read_status_message_id;
DROP INDEX peer_assessment.idx_chat_conversations_updated_at;
DROP INDEX peer_assessment.idx_chat_conversations_review_id;
DROP INDEX peer_assessment.idx_chat_conversations_participant2;
DROP INDEX peer_assessment.idx_chat_conversations_participant1;
DROP INDEX peer_assessment.idx_chat_conversations_ai;
DROP INDEX peer_assessment.idx_assignments_chat_type;
DROP INDEX peer_assessment.idx_assignment_rubrics_rubric_id;
DROP INDEX peer_assessment.idx_assignment_rubrics_assignment_id;
ALTER TABLE ONLY peer_assessment.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY peer_assessment.users DROP CONSTRAINT users_email_key;
ALTER TABLE ONLY peer_assessment.submissions DROP CONSTRAINT submissions_pkey;
ALTER TABLE ONLY peer_assessment.submissions DROP CONSTRAINT submissions_assignment_id_student_id_key;
ALTER TABLE ONLY peer_assessment.submission_attachments DROP CONSTRAINT submission_attachments_pkey;
ALTER TABLE ONLY peer_assessment.rubrics DROP CONSTRAINT rubrics_pkey;
ALTER TABLE ONLY peer_assessment.rubric_performance_levels DROP CONSTRAINT rubric_performance_levels_pkey;
ALTER TABLE ONLY peer_assessment.rubric_performance_levels DROP CONSTRAINT rubric_performance_levels_criterion_id_order_position_key;
ALTER TABLE ONLY peer_assessment.rubric_criteria DROP CONSTRAINT rubric_criteria_pkey;
ALTER TABLE ONLY peer_assessment.pending_enrollment_requests DROP CONSTRAINT pending_enrollment_requests_pkey;
ALTER TABLE ONLY peer_assessment.pending_enrollment_requests DROP CONSTRAINT pending_enrollment_requests_course_id_student_id_key;
ALTER TABLE ONLY peer_assessment.peer_reviews DROP CONSTRAINT peer_reviews_submission_id_reviewer_id_key;
ALTER TABLE ONLY peer_assessment.peer_reviews DROP CONSTRAINT peer_reviews_pkey;
ALTER TABLE ONLY peer_assessment.peer_review_scores DROP CONSTRAINT peer_review_scores_review_id_criterion_id_key;
ALTER TABLE ONLY peer_assessment.peer_review_scores DROP CONSTRAINT peer_review_scores_pkey;
ALTER TABLE ONLY peer_assessment.password_reset_tokens DROP CONSTRAINT password_reset_tokens_token_key;
ALTER TABLE ONLY peer_assessment.password_reset_tokens DROP CONSTRAINT password_reset_tokens_pkey;
ALTER TABLE ONLY peer_assessment.email_verification_tokens DROP CONSTRAINT email_verification_tokens_verification_token_key;
ALTER TABLE ONLY peer_assessment.email_verification_tokens DROP CONSTRAINT email_verification_tokens_pkey;
ALTER TABLE ONLY peer_assessment.courses DROP CONSTRAINT courses_pkey;
ALTER TABLE ONLY peer_assessment.course_invitations DROP CONSTRAINT course_invitations_pkey;
ALTER TABLE ONLY peer_assessment.course_invitations DROP CONSTRAINT course_invitations_invitation_token_key;
ALTER TABLE ONLY peer_assessment.course_invitations DROP CONSTRAINT course_invitations_course_id_student_email_key;
ALTER TABLE ONLY peer_assessment.course_enrollments DROP CONSTRAINT course_enrollments_pkey;
ALTER TABLE ONLY peer_assessment.course_enrollments DROP CONSTRAINT course_enrollments_course_id_student_id_key;
ALTER TABLE ONLY peer_assessment.chat_messages DROP CONSTRAINT chat_messages_pkey;
ALTER TABLE ONLY peer_assessment.chat_message_read_status DROP CONSTRAINT chat_message_read_status_pkey;
ALTER TABLE ONLY peer_assessment.chat_message_read_status DROP CONSTRAINT chat_message_read_status_message_id_user_id_key;
ALTER TABLE ONLY peer_assessment.chat_conversations DROP CONSTRAINT chat_conversations_review_id_key;
ALTER TABLE ONLY peer_assessment.chat_conversations DROP CONSTRAINT chat_conversations_pkey;
ALTER TABLE ONLY peer_assessment.assignments DROP CONSTRAINT assignments_pkey;
ALTER TABLE ONLY peer_assessment.assignment_rubrics DROP CONSTRAINT assignment_rubrics_pkey;
ALTER TABLE peer_assessment.users ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE peer_assessment.submissions ALTER COLUMN submission_id DROP DEFAULT;
ALTER TABLE peer_assessment.submission_attachments ALTER COLUMN attachment_id DROP DEFAULT;
ALTER TABLE peer_assessment.rubrics ALTER COLUMN rubric_id DROP DEFAULT;
ALTER TABLE peer_assessment.rubric_performance_levels ALTER COLUMN level_id DROP DEFAULT;
ALTER TABLE peer_assessment.rubric_criteria ALTER COLUMN criterion_id DROP DEFAULT;
ALTER TABLE peer_assessment.pending_enrollment_requests ALTER COLUMN request_id DROP DEFAULT;
ALTER TABLE peer_assessment.peer_reviews ALTER COLUMN review_id DROP DEFAULT;
ALTER TABLE peer_assessment.peer_review_scores ALTER COLUMN score_id DROP DEFAULT;
ALTER TABLE peer_assessment.password_reset_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE peer_assessment.email_verification_tokens ALTER COLUMN token_id DROP DEFAULT;
ALTER TABLE peer_assessment.courses ALTER COLUMN course_id DROP DEFAULT;
ALTER TABLE peer_assessment.course_invitations ALTER COLUMN invitation_id DROP DEFAULT;
ALTER TABLE peer_assessment.course_enrollments ALTER COLUMN enrollment_id DROP DEFAULT;
ALTER TABLE peer_assessment.chat_messages ALTER COLUMN message_id DROP DEFAULT;
ALTER TABLE peer_assessment.chat_message_read_status ALTER COLUMN read_status_id DROP DEFAULT;
ALTER TABLE peer_assessment.chat_conversations ALTER COLUMN conversation_id DROP DEFAULT;
ALTER TABLE peer_assessment.assignments ALTER COLUMN assignment_id DROP DEFAULT;
DROP SEQUENCE peer_assessment.users_user_id_seq;
DROP TABLE peer_assessment.users;
DROP SEQUENCE peer_assessment.submissions_submission_id_seq;
DROP TABLE peer_assessment.submissions;
DROP SEQUENCE peer_assessment.submission_attachments_attachment_id_seq;
DROP TABLE peer_assessment.submission_attachments;
DROP SEQUENCE peer_assessment.rubrics_rubric_id_seq;
DROP TABLE peer_assessment.rubrics;
DROP SEQUENCE peer_assessment.rubric_performance_levels_level_id_seq;
DROP TABLE peer_assessment.rubric_performance_levels;
DROP SEQUENCE peer_assessment.rubric_criteria_criterion_id_seq;
DROP TABLE peer_assessment.rubric_criteria;
DROP SEQUENCE peer_assessment.pending_enrollment_requests_request_id_seq;
DROP TABLE peer_assessment.pending_enrollment_requests;
DROP SEQUENCE peer_assessment.peer_reviews_review_id_seq;
DROP TABLE peer_assessment.peer_reviews;
DROP SEQUENCE peer_assessment.peer_review_scores_score_id_seq;
DROP TABLE peer_assessment.peer_review_scores;
DROP SEQUENCE peer_assessment.password_reset_tokens_id_seq;
DROP TABLE peer_assessment.password_reset_tokens;
DROP SEQUENCE peer_assessment.email_verification_tokens_token_id_seq;
DROP TABLE peer_assessment.email_verification_tokens;
DROP SEQUENCE peer_assessment.courses_course_id_seq;
DROP TABLE peer_assessment.courses;
DROP SEQUENCE peer_assessment.course_invitations_invitation_id_seq;
DROP TABLE peer_assessment.course_invitations;
DROP SEQUENCE peer_assessment.course_enrollments_enrollment_id_seq;
DROP TABLE peer_assessment.course_enrollments;
DROP SEQUENCE peer_assessment.chat_messages_message_id_seq;
DROP TABLE peer_assessment.chat_messages;
DROP SEQUENCE peer_assessment.chat_message_read_status_read_status_id_seq;
DROP TABLE peer_assessment.chat_message_read_status;
DROP SEQUENCE peer_assessment.chat_conversations_conversation_id_seq;
DROP TABLE peer_assessment.chat_conversations;
DROP SEQUENCE peer_assessment.assignments_assignment_id_seq;
DROP TABLE peer_assessment.assignments;
DROP TABLE peer_assessment.assignment_rubrics;
DROP FUNCTION peer_assessment.update_conversation_last_message();
DROP FUNCTION peer_assessment.cleanup_expired_verification_tokens();
DROP SCHEMA peer_assessment;
--
-- TOC entry 6 (class 2615 OID 16830)
-- Name: peer_assessment; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA peer_assessment;


--
-- TOC entry 254 (class 1255 OID 33280)
-- Name: cleanup_expired_verification_tokens(); Type: FUNCTION; Schema: peer_assessment; Owner: -
--

CREATE FUNCTION peer_assessment.cleanup_expired_verification_tokens() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM peer_assessment.email_verification_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP AND verified = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


--
-- TOC entry 253 (class 1255 OID 17180)
-- Name: update_conversation_last_message(); Type: FUNCTION; Schema: peer_assessment; Owner: -
--

CREATE FUNCTION peer_assessment.update_conversation_last_message() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE peer_assessment.chat_conversations 
    SET 
        last_message_at = NEW.sent_at,
        updated_at = NEW.sent_at
    WHERE conversation_id = NEW.conversation_id;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 16906)
-- Name: assignment_rubrics; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.assignment_rubrics (
    assignment_id integer NOT NULL,
    rubric_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 223 (class 1259 OID 16880)
-- Name: assignments; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.assignments (
    assignment_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    course_id integer,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ai_overall_prompt text,
    ai_criteria_prompt text,
    ai_prompts_enabled boolean DEFAULT true,
    ai_instructor_prompt text,
    ai_instructor_enabled boolean DEFAULT true,
    feedback_chat_type character varying(20) DEFAULT 'ai'::character varying,
    CONSTRAINT assignments_feedback_chat_type_check CHECK (((feedback_chat_type)::text = ANY ((ARRAY['ai'::character varying, 'peer'::character varying])::text[])))
);


--
-- TOC entry 3759 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN assignments.ai_overall_prompt; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.assignments.ai_overall_prompt IS 'Custom AI prompt for overall feedback analysis';


--
-- TOC entry 3760 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN assignments.ai_criteria_prompt; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.assignments.ai_criteria_prompt IS 'Custom AI prompt for criteria-specific feedback analysis';


--
-- TOC entry 3761 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN assignments.ai_prompts_enabled; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.assignments.ai_prompts_enabled IS 'Whether AI analysis is enabled for this assignment';


--
-- TOC entry 3762 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN assignments.ai_instructor_prompt; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.assignments.ai_instructor_prompt IS 'Custom AI prompt for instructor-generated peer reviews';


--
-- TOC entry 3763 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN assignments.ai_instructor_enabled; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.assignments.ai_instructor_enabled IS 'Whether instructors can generate AI peer reviews for this assignment';


--
-- TOC entry 3764 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN assignments.feedback_chat_type; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.assignments.feedback_chat_type IS 'Type of chat for feedback discussions: ai (default) or peer';


--
-- TOC entry 222 (class 1259 OID 16879)
-- Name: assignments_assignment_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.assignments_assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3765 (class 0 OID 0)
-- Dependencies: 222
-- Name: assignments_assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.assignments_assignment_id_seq OWNED BY peer_assessment.assignments.assignment_id;


--
-- TOC entry 244 (class 1259 OID 17101)
-- Name: chat_conversations; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.chat_conversations (
    conversation_id integer NOT NULL,
    review_id integer,
    participant1_id integer,
    participant2_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_message_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_ai_conversation boolean DEFAULT false,
    ai_assistant_id integer
);


--
-- TOC entry 3766 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN chat_conversations.is_ai_conversation; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.chat_conversations.is_ai_conversation IS 'Whether this conversation is between a user and AI assistant';


--
-- TOC entry 3767 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN chat_conversations.ai_assistant_id; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.chat_conversations.ai_assistant_id IS 'Virtual ID for AI assistant participant (-1 for AI assistant)';


--
-- TOC entry 243 (class 1259 OID 17100)
-- Name: chat_conversations_conversation_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.chat_conversations_conversation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3768 (class 0 OID 0)
-- Dependencies: 243
-- Name: chat_conversations_conversation_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.chat_conversations_conversation_id_seq OWNED BY peer_assessment.chat_conversations.conversation_id;


--
-- TOC entry 248 (class 1259 OID 17152)
-- Name: chat_message_read_status; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.chat_message_read_status (
    read_status_id integer NOT NULL,
    message_id integer,
    user_id integer,
    read_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 247 (class 1259 OID 17151)
-- Name: chat_message_read_status_read_status_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.chat_message_read_status_read_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3769 (class 0 OID 0)
-- Dependencies: 247
-- Name: chat_message_read_status_read_status_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.chat_message_read_status_read_status_id_seq OWNED BY peer_assessment.chat_message_read_status.read_status_id;


--
-- TOC entry 246 (class 1259 OID 17128)
-- Name: chat_messages; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.chat_messages (
    message_id integer NOT NULL,
    conversation_id integer,
    sender_id integer,
    message_text text NOT NULL,
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_read boolean DEFAULT false,
    message_type character varying(20) DEFAULT 'text'::character varying,
    CONSTRAINT chat_messages_message_type_check CHECK (((message_type)::text = ANY ((ARRAY['text'::character varying, 'system'::character varying, 'ai_response'::character varying, 'ai_suggestion'::character varying])::text[]))),
    CONSTRAINT check_sender_for_text_messages CHECK ((((message_type)::text = 'system'::text) OR ((message_type)::text = 'ai_response'::text) OR ((message_type)::text = 'ai_suggestion'::text) OR (sender_id IS NOT NULL)))
);


--
-- TOC entry 3770 (class 0 OID 0)
-- Dependencies: 246
-- Name: CONSTRAINT chat_messages_message_type_check ON chat_messages; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON CONSTRAINT chat_messages_message_type_check ON peer_assessment.chat_messages IS 'Allowed message types: text (user messages), system (system notifications), ai_response (AI chat responses), ai_suggestion (AI feedback improvement suggestions)';


--
-- TOC entry 245 (class 1259 OID 17127)
-- Name: chat_messages_message_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.chat_messages_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3771 (class 0 OID 0)
-- Dependencies: 245
-- Name: chat_messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.chat_messages_message_id_seq OWNED BY peer_assessment.chat_messages.message_id;


--
-- TOC entry 221 (class 1259 OID 16860)
-- Name: course_enrollments; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.course_enrollments (
    enrollment_id integer NOT NULL,
    course_id integer,
    student_id integer,
    enrollment_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 220 (class 1259 OID 16859)
-- Name: course_enrollments_enrollment_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.course_enrollments_enrollment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3772 (class 0 OID 0)
-- Dependencies: 220
-- Name: course_enrollments_enrollment_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.course_enrollments_enrollment_id_seq OWNED BY peer_assessment.course_enrollments.enrollment_id;


--
-- TOC entry 240 (class 1259 OID 17053)
-- Name: course_invitations; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.course_invitations (
    invitation_id integer NOT NULL,
    course_id integer,
    student_email character varying(100) NOT NULL,
    invitation_token character varying(255) NOT NULL,
    invited_by integer,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone DEFAULT (CURRENT_TIMESTAMP + '7 days'::interval),
    accepted_at timestamp with time zone,
    CONSTRAINT course_invitations_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'expired'::character varying])::text[])))
);


--
-- TOC entry 239 (class 1259 OID 17052)
-- Name: course_invitations_invitation_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.course_invitations_invitation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3773 (class 0 OID 0)
-- Dependencies: 239
-- Name: course_invitations_invitation_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.course_invitations_invitation_id_seq OWNED BY peer_assessment.course_invitations.invitation_id;


--
-- TOC entry 219 (class 1259 OID 16844)
-- Name: courses; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.courses (
    course_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    instructor_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 218 (class 1259 OID 16843)
-- Name: courses_course_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.courses_course_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3774 (class 0 OID 0)
-- Dependencies: 218
-- Name: courses_course_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.courses_course_id_seq OWNED BY peer_assessment.courses.course_id;


--
-- TOC entry 252 (class 1259 OID 33264)
-- Name: email_verification_tokens; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.email_verification_tokens (
    token_id integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    verification_token character varying(255) NOT NULL,
    selected_course_id integer,
    invitation_token character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '24:00:00'::interval),
    verified boolean DEFAULT false,
    verified_at timestamp without time zone
);


--
-- TOC entry 251 (class 1259 OID 33263)
-- Name: email_verification_tokens_token_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.email_verification_tokens_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3775 (class 0 OID 0)
-- Dependencies: 251
-- Name: email_verification_tokens_token_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.email_verification_tokens_token_id_seq OWNED BY peer_assessment.email_verification_tokens.token_id;


--
-- TOC entry 242 (class 1259 OID 17084)
-- Name: password_reset_tokens; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.password_reset_tokens (
    id integer NOT NULL,
    token character varying(255) NOT NULL,
    user_id integer NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 241 (class 1259 OID 17083)
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3776 (class 0 OID 0)
-- Dependencies: 241
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.password_reset_tokens_id_seq OWNED BY peer_assessment.password_reset_tokens.id;


--
-- TOC entry 238 (class 1259 OID 17021)
-- Name: peer_review_scores; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.peer_review_scores (
    score_id integer NOT NULL,
    review_id integer,
    criterion_id integer,
    score integer NOT NULL,
    feedback text
);


--
-- TOC entry 237 (class 1259 OID 17020)
-- Name: peer_review_scores_score_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.peer_review_scores_score_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3777 (class 0 OID 0)
-- Dependencies: 237
-- Name: peer_review_scores_score_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.peer_review_scores_score_id_seq OWNED BY peer_assessment.peer_review_scores.score_id;


--
-- TOC entry 236 (class 1259 OID 16997)
-- Name: peer_reviews; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.peer_reviews (
    review_id integer NOT NULL,
    submission_id integer,
    reviewer_id integer,
    overall_feedback text,
    total_score integer,
    status character varying(20) DEFAULT 'assigned'::character varying,
    assigned_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    completed_date timestamp with time zone,
    is_ai_generated boolean DEFAULT false,
    ai_model_used character varying(50),
    generated_by_instructor integer,
    ai_feedback_synthesis text,
    CONSTRAINT peer_reviews_status_check CHECK (((status)::text = ANY ((ARRAY['assigned'::character varying, 'in_progress'::character varying, 'completed'::character varying])::text[])))
);


--
-- TOC entry 3778 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN peer_reviews.is_ai_generated; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.peer_reviews.is_ai_generated IS 'Whether this review was generated by AI';


--
-- TOC entry 3779 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN peer_reviews.ai_model_used; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.peer_reviews.ai_model_used IS 'AI model used for generation (e.g., gpt-4, gpt-3.5-turbo)';


--
-- TOC entry 3780 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN peer_reviews.generated_by_instructor; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.peer_reviews.generated_by_instructor IS 'Instructor who generated the AI review';


--
-- TOC entry 3781 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN peer_reviews.ai_feedback_synthesis; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.peer_reviews.ai_feedback_synthesis IS 'AI-generated synthesis of detailed feedback and overall feedback highlighting main strengths and weaknesses';


--
-- TOC entry 235 (class 1259 OID 16996)
-- Name: peer_reviews_review_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.peer_reviews_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3782 (class 0 OID 0)
-- Dependencies: 235
-- Name: peer_reviews_review_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.peer_reviews_review_id_seq OWNED BY peer_assessment.peer_reviews.review_id;


--
-- TOC entry 250 (class 1259 OID 33231)
-- Name: pending_enrollment_requests; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.pending_enrollment_requests (
    request_id integer NOT NULL,
    course_id integer,
    student_id integer,
    student_name character varying(100) NOT NULL,
    student_email character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    requested_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    reviewed_at timestamp with time zone,
    reviewed_by integer,
    rejection_reason text,
    CONSTRAINT pending_enrollment_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- TOC entry 3783 (class 0 OID 0)
-- Dependencies: 250
-- Name: TABLE pending_enrollment_requests; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON TABLE peer_assessment.pending_enrollment_requests IS 'Stores pending enrollment requests that require instructor approval';


--
-- TOC entry 3784 (class 0 OID 0)
-- Dependencies: 250
-- Name: COLUMN pending_enrollment_requests.status; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.pending_enrollment_requests.status IS 'Status of the enrollment request: pending, approved, or rejected';


--
-- TOC entry 3785 (class 0 OID 0)
-- Dependencies: 250
-- Name: COLUMN pending_enrollment_requests.reviewed_by; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.pending_enrollment_requests.reviewed_by IS 'Instructor who approved or rejected the request';


--
-- TOC entry 3786 (class 0 OID 0)
-- Dependencies: 250
-- Name: COLUMN pending_enrollment_requests.rejection_reason; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.pending_enrollment_requests.rejection_reason IS 'Reason provided when rejecting an enrollment request';


--
-- TOC entry 249 (class 1259 OID 33230)
-- Name: pending_enrollment_requests_request_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.pending_enrollment_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3787 (class 0 OID 0)
-- Dependencies: 249
-- Name: pending_enrollment_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.pending_enrollment_requests_request_id_seq OWNED BY peer_assessment.pending_enrollment_requests.request_id;


--
-- TOC entry 228 (class 1259 OID 16923)
-- Name: rubric_criteria; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.rubric_criteria (
    criterion_id integer NOT NULL,
    rubric_id integer,
    name character varying(100) NOT NULL,
    description text,
    max_points integer NOT NULL,
    weight numeric(3,2) DEFAULT 1.0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 227 (class 1259 OID 16922)
-- Name: rubric_criteria_criterion_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.rubric_criteria_criterion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3788 (class 0 OID 0)
-- Dependencies: 227
-- Name: rubric_criteria_criterion_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.rubric_criteria_criterion_id_seq OWNED BY peer_assessment.rubric_criteria.criterion_id;


--
-- TOC entry 230 (class 1259 OID 16940)
-- Name: rubric_performance_levels; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.rubric_performance_levels (
    level_id integer NOT NULL,
    criterion_id integer,
    description text NOT NULL,
    points integer NOT NULL,
    order_position integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 229 (class 1259 OID 16939)
-- Name: rubric_performance_levels_level_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.rubric_performance_levels_level_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3789 (class 0 OID 0)
-- Dependencies: 229
-- Name: rubric_performance_levels_level_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.rubric_performance_levels_level_id_seq OWNED BY peer_assessment.rubric_performance_levels.level_id;


--
-- TOC entry 225 (class 1259 OID 16896)
-- Name: rubrics; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.rubrics (
    rubric_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 224 (class 1259 OID 16895)
-- Name: rubrics_rubric_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.rubrics_rubric_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3790 (class 0 OID 0)
-- Dependencies: 224
-- Name: rubrics_rubric_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.rubrics_rubric_id_seq OWNED BY peer_assessment.rubrics.rubric_id;


--
-- TOC entry 234 (class 1259 OID 16982)
-- Name: submission_attachments; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.submission_attachments (
    attachment_id integer NOT NULL,
    submission_id integer,
    file_name character varying(255) NOT NULL,
    file_path character varying(255) NOT NULL,
    file_size integer NOT NULL,
    file_type character varying(100),
    upload_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 233 (class 1259 OID 16981)
-- Name: submission_attachments_attachment_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.submission_attachments_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3791 (class 0 OID 0)
-- Dependencies: 233
-- Name: submission_attachments_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.submission_attachments_attachment_id_seq OWNED BY peer_assessment.submission_attachments.attachment_id;


--
-- TOC entry 232 (class 1259 OID 16958)
-- Name: submissions; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.submissions (
    submission_id integer NOT NULL,
    assignment_id integer,
    student_id integer,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    submission_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'submitted'::character varying,
    ai_submission_analysis text,
    aggregated_feedback_synthesis text,
    aggregated_synthesis_generated_at timestamp with time zone,
    CONSTRAINT submissions_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'reviewed'::character varying])::text[])))
);


--
-- TOC entry 3792 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN submissions.ai_submission_analysis; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.submissions.ai_submission_analysis IS 'AI-generated analysis of submission quality against rubric criteria, providing initial feedback to students';


--
-- TOC entry 3793 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN submissions.aggregated_feedback_synthesis; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.submissions.aggregated_feedback_synthesis IS 'AI-generated synthesis of multiple peer reviews for this submission highlighting combined strengths and weaknesses';


--
-- TOC entry 3794 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN submissions.aggregated_synthesis_generated_at; Type: COMMENT; Schema: peer_assessment; Owner: -
--

COMMENT ON COLUMN peer_assessment.submissions.aggregated_synthesis_generated_at IS 'Timestamp when the aggregated feedback synthesis was last generated';


--
-- TOC entry 231 (class 1259 OID 16957)
-- Name: submissions_submission_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.submissions_submission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3795 (class 0 OID 0)
-- Dependencies: 231
-- Name: submissions_submission_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.submissions_submission_id_seq OWNED BY peer_assessment.submissions.submission_id;


--
-- TOC entry 217 (class 1259 OID 16832)
-- Name: users; Type: TABLE; Schema: peer_assessment; Owner: -
--

CREATE TABLE peer_assessment.users (
    user_id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 216 (class 1259 OID 16831)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: peer_assessment; Owner: -
--

CREATE SEQUENCE peer_assessment.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3796 (class 0 OID 0)
-- Dependencies: 216
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: peer_assessment; Owner: -
--

ALTER SEQUENCE peer_assessment.users_user_id_seq OWNED BY peer_assessment.users.user_id;


--
-- TOC entry 3383 (class 2604 OID 16883)
-- Name: assignments assignment_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.assignments ALTER COLUMN assignment_id SET DEFAULT nextval('peer_assessment.assignments_assignment_id_seq'::regclass);


--
-- TOC entry 3416 (class 2604 OID 17104)
-- Name: chat_conversations conversation_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_conversations ALTER COLUMN conversation_id SET DEFAULT nextval('peer_assessment.chat_conversations_conversation_id_seq'::regclass);


--
-- TOC entry 3425 (class 2604 OID 17155)
-- Name: chat_message_read_status read_status_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_message_read_status ALTER COLUMN read_status_id SET DEFAULT nextval('peer_assessment.chat_message_read_status_read_status_id_seq'::regclass);


--
-- TOC entry 3421 (class 2604 OID 17131)
-- Name: chat_messages message_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_messages ALTER COLUMN message_id SET DEFAULT nextval('peer_assessment.chat_messages_message_id_seq'::regclass);


--
-- TOC entry 3381 (class 2604 OID 16863)
-- Name: course_enrollments enrollment_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.course_enrollments ALTER COLUMN enrollment_id SET DEFAULT nextval('peer_assessment.course_enrollments_enrollment_id_seq'::regclass);


--
-- TOC entry 3410 (class 2604 OID 17056)
-- Name: course_invitations invitation_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.course_invitations ALTER COLUMN invitation_id SET DEFAULT nextval('peer_assessment.course_invitations_invitation_id_seq'::regclass);


--
-- TOC entry 3378 (class 2604 OID 16847)
-- Name: courses course_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.courses ALTER COLUMN course_id SET DEFAULT nextval('peer_assessment.courses_course_id_seq'::regclass);


--
-- TOC entry 3430 (class 2604 OID 33267)
-- Name: email_verification_tokens token_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.email_verification_tokens ALTER COLUMN token_id SET DEFAULT nextval('peer_assessment.email_verification_tokens_token_id_seq'::regclass);


--
-- TOC entry 3414 (class 2604 OID 17087)
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('peer_assessment.password_reset_tokens_id_seq'::regclass);


--
-- TOC entry 3409 (class 2604 OID 17024)
-- Name: peer_review_scores score_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.peer_review_scores ALTER COLUMN score_id SET DEFAULT nextval('peer_assessment.peer_review_scores_score_id_seq'::regclass);


--
-- TOC entry 3405 (class 2604 OID 17000)
-- Name: peer_reviews review_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.peer_reviews ALTER COLUMN review_id SET DEFAULT nextval('peer_assessment.peer_reviews_review_id_seq'::regclass);


--
-- TOC entry 3427 (class 2604 OID 33234)
-- Name: pending_enrollment_requests request_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.pending_enrollment_requests ALTER COLUMN request_id SET DEFAULT nextval('peer_assessment.pending_enrollment_requests_request_id_seq'::regclass);


--
-- TOC entry 3393 (class 2604 OID 16926)
-- Name: rubric_criteria criterion_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.rubric_criteria ALTER COLUMN criterion_id SET DEFAULT nextval('peer_assessment.rubric_criteria_criterion_id_seq'::regclass);


--
-- TOC entry 3397 (class 2604 OID 16943)
-- Name: rubric_performance_levels level_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.rubric_performance_levels ALTER COLUMN level_id SET DEFAULT nextval('peer_assessment.rubric_performance_levels_level_id_seq'::regclass);


--
-- TOC entry 3389 (class 2604 OID 16899)
-- Name: rubrics rubric_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.rubrics ALTER COLUMN rubric_id SET DEFAULT nextval('peer_assessment.rubrics_rubric_id_seq'::regclass);


--
-- TOC entry 3403 (class 2604 OID 16985)
-- Name: submission_attachments attachment_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.submission_attachments ALTER COLUMN attachment_id SET DEFAULT nextval('peer_assessment.submission_attachments_attachment_id_seq'::regclass);


--
-- TOC entry 3400 (class 2604 OID 16961)
-- Name: submissions submission_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.submissions ALTER COLUMN submission_id SET DEFAULT nextval('peer_assessment.submissions_submission_id_seq'::regclass);


--
-- TOC entry 3375 (class 2604 OID 16835)
-- Name: users user_id; Type: DEFAULT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.users ALTER COLUMN user_id SET DEFAULT nextval('peer_assessment.users_user_id_seq'::regclass);


--
-- TOC entry 3727 (class 0 OID 16906)
-- Dependencies: 226
-- Data for Name: assignment_rubrics; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.assignment_rubrics (assignment_id, rubric_id, created_at) FROM stdin;
6	3	2025-09-02 13:17:46.880717+03
8	3	2025-09-02 13:17:46.880808+03
7	3	2025-09-02 13:17:46.881201+03
10	3	2025-09-02 13:17:46.910975+03
5	3	2025-09-02 13:17:46.911017+03
9	3	2025-09-02 13:17:46.911039+03
12	3	2025-09-22 11:15:43.088435+03
13	3	2025-09-22 11:33:04.660987+03
14	3	2025-09-22 11:44:50.119232+03
15	3	2025-09-22 11:48:17.446011+03
16	3	2025-09-22 11:49:27.259432+03
17	3	2025-09-22 12:31:37.729607+03
18	3	2025-09-22 13:28:59.72641+03
19	4	2025-09-25 16:00:15.901462+03
\.


--
-- TOC entry 3724 (class 0 OID 16880)
-- Dependencies: 223
-- Data for Name: assignments; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.assignments (assignment_id, title, description, course_id, due_date, created_at, updated_at, ai_overall_prompt, ai_criteria_prompt, ai_prompts_enabled, ai_instructor_prompt, ai_instructor_enabled, feedback_chat_type) FROM stdin;
6	Algo 2	asd	5	2025-08-22 23:59:59+03	2025-08-10 13:51:48.765485+03	2025-08-10 13:51:48.765485+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	ai
7	Algo 3	gdsasdgaa	5	2025-08-29 23:59:59+03	2025-08-10 13:57:31.743883+03	2025-08-10 13:57:31.743883+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	ai
8	safasf	asfasfasfa	5	2025-08-22 23:59:59+03	2025-08-20 13:56:55.13729+03	2025-08-20 13:56:55.13729+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	ai
9	safasf	asfasfasfa	5	2025-08-22 23:59:59+03	2025-08-20 13:56:56.683778+03	2025-08-20 13:56:56.683778+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	ai
10	Algo 2	Algo test	5	2026-12-05 00:00:00+03	2025-09-02 13:17:10.284904+03	2025-09-02 16:23:18.467761+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	ai
5	Algo Assignment	Algo testing	5	2025-12-11 00:00:00+03	2025-08-10 13:34:20.146063+03	2025-09-02 16:24:48.145532+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	ai
12	chatbox test	test	5	2026-12-12 00:00:00+03	2025-09-22 11:15:43.072299+03	2025-09-22 11:31:35.675263+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	peer
14	aggagg	gdsfgdsgfddg	5	2027-12-12 23:59:59+03	2025-09-22 11:44:50.097248+03	2025-09-22 11:44:50.097248+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	ai
11	Algo Test	sdfdsf	5	2026-12-12 23:59:59+03	2025-09-02 15:06:54.316303+03	2025-09-02 15:06:54.316303+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	ai
15	testasdasdasdassda	asdsad	5	2026-12-12 23:59:59+03	2025-09-22 11:48:17.416486+03	2025-09-22 11:48:17.416486+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	peer
13	chatbox test 2	test 2	5	2026-12-12 00:00:00+03	2025-09-22 11:33:04.638959+03	2025-09-22 11:48:39.802349+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	peer
16	test 33	asdsa	5	2027-12-12 23:59:59+03	2025-09-22 11:49:27.244878+03	2025-09-22 11:49:27.244878+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	peer
17	test 44	asdsa	5	2026-12-12 23:59:59+03	2025-09-22 12:31:37.707469+03	2025-09-22 12:31:37.707469+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	ai
19	Python Data Structures Assignment	Create a Python program that implements and demonstrates the use of lists, dictionaries, and sets. Your program should:\n\n1. Create a student management system using dictionaries\n2. Implement functions to add, remove, and search for students\n3. Use lists to store student grades and calculate averages\n4. Use sets to track unique courses taken by students\n5. Include proper error handling and input validation\n6. Write unit tests for your functions\n7. Document your code with docstrings and comments\n\nSubmission Requirements:\n- Submit a .py file with your complete program\n- Include a README.md file explaining how to run your program\n- Include test cases that demonstrate all functionality\n- Code should follow PEP 8 style guidelines\n\nGrading will be based on functionality, code quality, algorithm efficiency, and documentation.	6	2025-10-09 16:00:15.901462+03	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03	\N	\N	t	\N	t	peer
18	Pointer Test	Create a program that:\n\nDeclares two integer variables, a and b, with initial values (e.g., 5 and 10).\n\nDeclares two integer pointers, p1 and p2.\n\nAssigns the addresses of a and b to the pointers.\n\nPrint out:\n\nThe values of a and b.\n\nThe addresses of a and b.\n\nThe values stored in p1 and p2.\n\nThe values pointed to by p1 and p2.\n\nUsing only the pointers (p1 and p2), swap the values of a and b.\n\nPrint the new values of a and b after the swap.\n\nExpected Output Example (values may vary):\n\nBefore swap:\na = 5, b = 10\np1 points to value: 5\np2 points to value: 10\n\nAfter swap using pointers:\na = 10, b = 5	5	2026-12-10 00:00:00+03	2025-09-22 13:12:45.10732+03	2025-09-22 13:28:59.70081+03	Please provide constructive suggestions to improve the overall feedback. Focus on making the feedback more helpful, specific, and balanced. Keep your response concise and actionable.	Your tasks:\n\n1. Suggest 1 specific improvement to the feedback for this criterion to the reviewer. The suggestion should be concise and actionable.\n2. After the suggestion, provide a single revised version of the feedback as if written by the reviewer, incorporating the improvement. Write it in the reviewer's voice.\n\nFormat your response as:\n1. [suggestion]. Revised Feedback Example: "[your rewritten reviewer feedback here]"	t	\N	t	ai
\.


--
-- TOC entry 3745 (class 0 OID 17101)
-- Dependencies: 244
-- Data for Name: chat_conversations; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.chat_conversations (conversation_id, review_id, participant1_id, participant2_id, created_at, updated_at, last_message_at, is_ai_conversation, ai_assistant_id) FROM stdin;
1	6	8	9	2025-08-10 13:41:40.017891+03	2025-08-10 13:41:40.163924+03	2025-08-10 13:41:40.163924+03	f	\N
3	8	9	8	2025-08-10 14:27:47.773002+03	2025-08-10 14:28:08.521986+03	2025-08-10 14:28:08.521986+03	f	\N
5	7	9	8	2025-08-10 14:30:30.719056+03	2025-08-10 14:30:30.737148+03	2025-08-10 14:30:30.737148+03	f	\N
28	20	14	15	2025-09-25 16:20:39.584345+03	2025-09-25 22:52:46.488357+03	2025-09-25 22:52:46.488357+03	f	\N
7	11	9	7	2025-09-02 13:37:02.584041+03	2025-09-02 14:05:15.382308+03	2025-09-02 14:05:15.382308+03	t	-1
6	5	9	8	2025-08-10 14:33:46.877244+03	2025-09-22 11:08:13.425628+03	2025-09-22 11:08:13.425628+03	f	\N
12	12	8	\N	2025-09-22 11:18:50.689572+03	2025-09-22 11:32:19.259244+03	2025-09-22 11:32:19.259244+03	t	-1
14	13	9	\N	2025-09-22 11:35:16.318309+03	2025-09-22 11:49:04.634529+03	2025-09-22 11:49:04.634529+03	t	-1
16	14	9	8	2025-09-22 11:51:18.387288+03	2025-09-22 11:51:21.009454+03	2025-09-22 11:51:21.009454+03	f	\N
18	15	8	\N	2025-09-22 12:35:12.688719+03	2025-09-22 12:35:12.706812+03	2025-09-22 12:35:12.706812+03	t	-1
20	16	9	\N	2025-09-22 12:38:27.939788+03	2025-09-22 12:38:27.959416+03	2025-09-22 12:38:27.959416+03	t	-1
22	17	9	\N	2025-09-22 13:30:28.303324+03	2025-09-22 13:30:57.450297+03	2025-09-22 13:30:57.450297+03	t	-1
24	19	10	\N	2025-09-23 12:03:41.966444+03	2025-09-23 12:03:41.981292+03	2025-09-23 12:03:41.981292+03	t	-1
26	18	10	\N	2025-09-23 12:05:06.145827+03	2025-09-23 13:05:11.088652+03	2025-09-23 13:05:11.088652+03	t	-1
30	22	14	17	2025-09-25 22:39:21.792817+03	2025-09-25 22:39:21.805985+03	2025-09-25 22:39:21.805985+03	f	\N
\.


--
-- TOC entry 3749 (class 0 OID 17152)
-- Dependencies: 248
-- Data for Name: chat_message_read_status; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.chat_message_read_status (read_status_id, message_id, user_id, read_at) FROM stdin;
1	3	9	2025-08-10 14:28:08.540962+03
2	6	9	2025-08-10 14:34:04.858945+03
3	6	8	2025-08-10 14:34:13.27178+03
4	7	9	2025-08-10 14:34:21.445941+03
5	7	8	2025-08-10 14:34:29.115567+03
6	8	9	2025-08-20 12:12:47.130894+03
7	8	8	2025-08-20 12:16:42.999572+03
8	9	8	2025-08-20 12:17:58.141988+03
9	9	9	2025-08-20 12:18:05.224944+03
10	10	8	2025-08-20 13:48:13.485489+03
11	10	9	2025-08-20 13:52:12.56663+03
12	11	9	2025-08-20 13:52:21.233089+03
13	11	8	2025-08-20 13:52:26.073402+03
14	12	9	2025-08-20 14:08:49.295514+03
15	12	8	2025-08-20 14:09:02.033457+03
16	13	8	2025-08-20 14:09:04.974029+03
17	13	9	2025-08-20 14:09:12.63388+03
18	15	9	2025-09-02 13:51:44.303196+03
19	16	9	2025-09-02 13:55:17.133639+03
20	17	9	2025-09-02 13:55:45.81576+03
21	18	9	2025-09-02 13:56:04.319368+03
22	19	9	2025-09-02 13:58:45.455692+03
23	20	9	2025-09-02 14:00:30.025135+03
24	22	9	2025-09-02 14:03:53.101495+03
25	24	9	2025-09-02 14:05:14.251754+03
26	26	9	2025-09-22 11:08:13.445829+03
27	28	8	2025-09-22 11:18:59.00118+03
28	30	8	2025-09-22 11:32:17.778778+03
29	33	9	2025-09-22 11:35:20.05235+03
30	35	9	2025-09-22 11:49:02.395337+03
31	38	9	2025-09-22 11:51:21.03568+03
32	38	8	2025-09-22 11:51:58.077493+03
33	42	9	2025-09-22 13:30:55.208565+03
34	46	10	2025-09-23 13:05:10.161071+03
35	49	14	2025-09-25 16:21:02.134529+03
36	49	15	2025-09-25 16:21:12.468189+03
37	50	15	2025-09-25 16:21:55.963172+03
38	52	15	2025-09-25 16:35:58.723573+03
39	50	14	2025-09-25 22:39:05.669906+03
40	52	14	2025-09-25 22:39:05.669906+03
41	55	14	2025-09-25 22:39:42.348972+03
42	56	14	2025-09-25 22:39:44.182399+03
43	57	14	2025-09-25 22:39:46.313463+03
44	58	14	2025-09-25 22:39:48.23949+03
45	59	14	2025-09-25 22:39:51.561197+03
46	55	15	2025-09-25 22:40:44.638772+03
47	56	15	2025-09-25 22:40:44.638772+03
48	57	15	2025-09-25 22:40:44.638772+03
49	58	15	2025-09-25 22:40:44.638772+03
50	59	15	2025-09-25 22:40:44.638772+03
51	60	15	2025-09-25 22:40:53.01704+03
52	62	15	2025-09-25 22:40:56.420389+03
53	64	15	2025-09-25 22:41:01.174493+03
54	66	15	2025-09-25 22:41:38.494353+03
55	68	15	2025-09-25 22:41:49.416671+03
56	70	15	2025-09-25 22:42:03.805235+03
57	72	15	2025-09-25 22:42:23.922094+03
58	74	15	2025-09-25 22:42:33.096167+03
59	60	14	2025-09-25 22:43:04.365233+03
60	62	14	2025-09-25 22:43:04.365233+03
61	64	14	2025-09-25 22:43:04.365233+03
62	66	14	2025-09-25 22:43:04.365233+03
63	68	14	2025-09-25 22:43:04.365233+03
64	70	14	2025-09-25 22:43:04.365233+03
65	72	14	2025-09-25 22:43:04.365233+03
66	74	14	2025-09-25 22:43:04.365233+03
67	76	14	2025-09-25 22:43:46.522621+03
68	76	15	2025-09-25 22:52:26.487787+03
69	77	15	2025-09-25 22:52:44.88234+03
\.


--
-- TOC entry 3747 (class 0 OID 17128)
-- Dependencies: 246
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.chat_messages (message_id, conversation_id, sender_id, message_text, sent_at, is_read, message_type) FROM stdin;
1	1	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-08-10 13:41:40.163924+03	f	system
2	3	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-08-10 14:27:47.812886+03	f	system
3	3	9	Hey, why you mean	2025-08-10 14:28:08.521986+03	f	text
4	5	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-08-10 14:30:30.737148+03	f	system
5	6	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-08-10 14:33:46.896147+03	f	system
6	6	9	hey	2025-08-10 14:34:04.830171+03	f	text
7	6	9	why you mean	2025-08-10 14:34:21.426759+03	f	text
8	6	9	test	2025-08-20 12:12:47.09644+03	f	text
9	6	8	test	2025-08-20 12:17:58.112588+03	f	text
10	6	8	test	2025-08-20 13:48:13.455643+03	f	text
11	6	9	asfasfasas	2025-08-20 13:52:21.205262+03	f	text
12	6	9	test	2025-08-20 14:08:49.265296+03	f	text
13	6	8	asfasf	2025-08-20 14:09:04.942065+03	f	text
14	7	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-09-02 13:37:02.604178+03	f	system
15	7	9	Can you give it more detail	2025-09-02 13:51:44.275743+03	f	text
16	7	9	can you give more detail	2025-09-02 13:55:17.115862+03	f	text
17	7	9	hey	2025-09-02 13:55:45.791262+03	f	text
18	7	9	hey	2025-09-02 13:56:04.29548+03	f	text
19	7	9	give more detail	2025-09-02 13:58:45.433903+03	f	text
20	7	9	how to improve big o	2025-09-02 14:00:29.994889+03	f	text
21	7	\N	To improve the Big O of your bad_permutations function, focus on optimizing the recursive calls to reduce redundant calculations. Try to analyze where you can trim down unnecessary permutations by refining the logic of your algorithm. Consider ways to streamline the process to make it more efficient. You can also explore techniques like memoization to store and reuse previously computed results to enhance performance. By refining your approach and reducing unnecessary work, you can make your function more time-efficient. Keep practicing and experimenting with different strategies to enhance your algorithm's efficiency and scalability.	2025-09-02 14:00:32.680328+03	f	ai_response
22	7	9	how to improve big o	2025-09-02 14:03:53.077453+03	f	text
23	7	\N	Hey! I'm glad you're looking to improve the Big O of your bad_permutations function. To enhance it, focus on streamlining your recursive calls to avoid unnecessary calculations. Look for ways to cut down on redundant permutations and optimize the logic flow. You can also try using memoization to store and reuse computed results efficiently. Keep tinkering with your approach, and with practice, you'll find ways to make your function more time-efficient. You're on the right track, just keep refining your algorithm!	2025-09-02 14:03:54.917865+03	f	ai_response
24	7	9	why did you give me 4/10 in big o exactly	2025-09-02 14:05:14.228142+03	f	text
25	7	\N	I noticed that your current implementation could have a high time complexity due to creating many unnecessary permutations, which can impact the efficiency of your function. I gave you that score because I believe there's room to optimize your algorithm to make it more efficient and effective. Keep experimenting and refining your approach!	2025-09-02 14:05:15.382308+03	f	ai_response
26	6	9	give feedback	2025-09-22 11:08:13.425628+03	f	text
27	12	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-09-22 11:18:50.712272+03	f	system
28	12	8	why you give me that low	2025-09-22 11:18:58.976459+03	f	text
29	12	\N	I thought your Big O explanation and precision could use some improvement, so I rated them lower. Don't worry, it's all part of the learning process!	2025-09-22 11:19:00.895253+03	f	ai_response
30	12	8	hey	2025-09-22 11:32:17.753719+03	f	text
31	12	\N	Hey! I noticed some areas in your Big O explanation and precision that could use some work, so I gave you that score. It's all about learning and improving together!	2025-09-22 11:32:19.259244+03	f	ai_response
32	14	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-09-22 11:35:16.341414+03	f	system
33	14	9	hey why	2025-09-22 11:35:20.027928+03	f	text
34	14	\N	I noticed your Big O and Precision could be stronger in the chatbox test. I gave that feedback to help you improve your work!	2025-09-22 11:35:22.557008+03	f	ai_response
35	14	9	hey	2025-09-22 11:49:02.370484+03	f	text
36	14	\N	Hey! I noticed your Big O and Precision could use some improvement in the chatbox test. Just giving you some tips to help boost your score!	2025-09-22 11:49:04.634529+03	f	ai_response
37	16	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-09-22 11:51:18.409703+03	f	system
38	16	9	why	2025-09-22 11:51:21.009454+03	f	text
39	18	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-09-22 12:35:12.706812+03	f	system
40	20	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-09-22 12:38:27.959416+03	f	system
41	22	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-09-22 13:30:28.324833+03	f	system
42	22	9	More detail on what im missing	2025-09-22 13:30:55.183799+03	f	text
43	22	\N	Hey! I noticed your submission was missing the part where you swap values using pointers and print the updated values afterward. Including that would make your work more complete. Great job on what you have so far!	2025-09-22 13:30:57.450297+03	f	ai_response
44	24	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-09-23 12:03:41.981292+03	f	system
45	26	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-09-23 12:05:06.167001+03	f	system
46	26	10	why	2025-09-23 13:05:10.148393+03	f	text
47	26	\N	I gave you that score because I felt the Big O and Precision aspects needed improvement. Don't worry, with a few adjustments, your submission can meet the assignment requirements!	2025-09-23 13:05:11.088652+03	f	ai_response
48	28	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-09-25 16:20:39.610722+03	f	system
49	28	14	hey	2025-09-25 16:21:02.113837+03	f	text
50	28	15	So, you could do better	2025-09-25 16:21:55.941563+03	f	text
51	28	\N	💡  Providing more specific feedback by addressing the lack of dictionaries and sets, flawed logic in functions, and poor code quality and style would help the student understand exactly where they need to improve. Balancing constructive criticism with encouragement can motivate the student to enhance their submission effectively. Remember to highlight the areas for improvement identified in the submission analysis to guide the student towards addressing key issues comprehensively.	2025-09-25 16:21:57.021371+03	f	ai_suggestion
52	28	15	maybe a little better too	2025-09-25 16:35:58.709718+03	f	text
53	28	\N	💡 Provide specific examples and actionable suggestions for improvement, such as recommending implementing dictionaries for efficient data storage and explaining the importance of error handling.	2025-09-25 16:36:00.074831+03	f	ai_suggestion
54	30	\N	Chat conversation started. You can now discuss the peer review feedback.	2025-09-25 22:39:21.805985+03	f	system
55	28	14	test	2025-09-25 22:39:42.324692+03	f	text
56	28	14	test	2025-09-25 22:39:44.16182+03	f	text
57	28	14	test	2025-09-25 22:39:46.297065+03	f	text
58	28	14	tes	2025-09-25 22:39:48.219396+03	f	text
59	28	14	test	2025-09-25 22:39:51.540674+03	f	text
60	28	15	test	2025-09-25 22:40:52.994491+03	f	text
61	28	\N	💡 Provide specific feedback on test cases related to function functionality, expected behavior, and edge cases to enhance evaluation effectiveness.	2025-09-25 22:40:54.925302+03	f	ai_suggestion
62	28	15	test	2025-09-25 22:40:56.400603+03	f	text
63	28	\N	💡 Provide specific, actionable feedback on functionality, code quality, algorithm logic, and documentation to help the student improve their submission effectively.	2025-09-25 22:40:57.654523+03	f	ai_suggestion
64	28	15	test	2025-09-25 22:41:01.162698+03	f	text
65	28	\N	💡 Provide specific examples or explanations related to the flawed logic in functions to help the student understand and improve their implementation.	2025-09-25 22:41:02.347605+03	f	ai_suggestion
66	28	15	You could include all the requirements	2025-09-25 22:41:38.475365+03	f	text
67	28	\N	💡 Provide specific examples of missing requirements like dictionaries, sets, error handling, and unit tests for targeted feedback.	2025-09-25 22:41:39.104891+03	f	ai_suggestion
68	28	15	Your logic is flawed	2025-09-25 22:41:49.398795+03	f	text
69	28	\N	💡 Provide specific examples of flawed logic in the code, such as the find function always returning 'not found' except for the last student checked.	2025-09-25 22:41:50.150318+03	f	ai_suggestion
70	28	15	Comments missing	2025-09-25 22:42:03.781987+03	f	text
71	28	\N	💡 Provide specific comments on functions, variables, and code logic to guide the student in addressing issues effectively.	2025-09-25 22:42:05.354933+03	f	ai_suggestion
72	28	15	Poor code quality	2025-09-25 22:42:23.911257+03	f	text
73	28	\N	💡 Provide specific examples of poor code quality, such as inconsistent indentation or unclear variable names, to guide the student on improvements.	2025-09-25 22:42:24.551305+03	f	ai_suggestion
74	28	15	Some functions don't work	2025-09-25 22:42:33.07609+03	f	text
75	28	\N	💡 Provide specific examples of non-working functions and suggest areas for improvement to guide the student effectively.	2025-09-25 22:42:34.331394+03	f	ai_suggestion
76	28	14	Thank you! However, little bit more detail is appreciated.	2025-09-25 22:43:46.503369+03	f	text
77	28	15	Fix the mistakes in algorithm.	2025-09-25 22:52:44.875337+03	f	text
78	28	\N	💡 Provide specific examples of algorithm errors and suggest alternative approaches for efficient student management system implementation.	2025-09-25 22:52:46.488357+03	f	ai_suggestion
\.


--
-- TOC entry 3722 (class 0 OID 16860)
-- Dependencies: 221
-- Data for Name: course_enrollments; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.course_enrollments (enrollment_id, course_id, student_id, enrollment_date) FROM stdin;
8	5	8	2025-08-10 12:35:13.665754+03
9	5	9	2025-08-10 13:33:13.758061+03
10	5	10	2025-09-23 11:48:35.918519+03
11	5	11	2025-09-23 12:52:43.333887+03
12	6	12	2025-09-25 16:03:43.17668+03
13	6	13	2025-09-25 16:03:43.17668+03
14	6	14	2025-09-25 16:06:07.390061+03
15	6	15	2025-09-25 16:06:07.390061+03
16	6	16	2025-09-25 16:06:07.390061+03
17	6	17	2025-09-25 16:06:07.390061+03
18	6	18	2025-09-25 16:06:07.390061+03
19	6	19	2025-09-25 16:06:07.390061+03
20	6	20	2025-09-25 16:06:07.390061+03
21	6	21	2025-09-25 16:06:07.390061+03
22	6	22	2025-10-10 10:38:49.689894+03
23	6	23	2025-10-10 10:52:55.890965+03
\.


--
-- TOC entry 3741 (class 0 OID 17053)
-- Dependencies: 240
-- Data for Name: course_invitations; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.course_invitations (invitation_id, course_id, student_email, invitation_token, invited_by, status, created_at, expires_at, accepted_at) FROM stdin;
1	5	fairnapse@gmail.com	76b7d4e621ac2adf1c07e414b79648fa8006223b922c6b7c0d7a989981fd0a51	7	accepted	2025-08-09 15:46:26.941121+03	2025-08-16 15:46:26.941121+03	2025-08-10 12:35:13.665754+03
2	5	muhammedsinanov@gmail.com	5f1a49afaac1509f8929466f0413a6bca5f46f9d40b4ff0854127acfcd7d60b1	7	pending	2025-08-10 13:31:05.596695+03	2025-08-17 13:31:05.596695+03	\N
3	5	muhammed.sinan0@hotmail.com	1d12dfa1e788ad040d3579dad84994ce712498a8c7fda080a2a5686c42bc73a8	7	accepted	2025-08-10 13:32:40.447323+03	2025-08-17 13:32:40.447323+03	2025-08-10 13:33:13.758061+03
\.


--
-- TOC entry 3720 (class 0 OID 16844)
-- Dependencies: 219
-- Data for Name: courses; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.courses (course_id, name, description, instructor_id, created_at, updated_at) FROM stdin;
5	Intro to CompSci	introduction	7	2025-08-09 15:45:36.238154+03	2025-08-09 15:45:36.238154+03
6	Introduction to Python Programming	A comprehensive course covering Python fundamentals, data structures, and object-oriented programming concepts.	7	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
\.


--
-- TOC entry 3753 (class 0 OID 33264)
-- Dependencies: 252
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.email_verification_tokens (token_id, email, name, password_hash, verification_token, selected_course_id, invitation_token, created_at, expires_at, verified, verified_at) FROM stdin;
1	muhammed.sinan@metu.edu.tr	sin	$2b$10$34aPwKT2EEjtA9BHYbjTyOzaBK.fmtvAlVghSZNYUM1bTP7W4ZfZW	079412a54a1634732613f8276b4c9654a43763bd1dec2eb0c62a9a7086801604	5	\N	2025-10-10 11:34:11.610425	2025-10-11 11:34:11.610425	f	\N
2	muhammed.sinan@metu.edu.tr	sinn	$2b$10$rev1E0c9h8CuKROkCs2cnOT9BYdtttDeVzvlTnlbk6pzDx3Y3FHT.	b1e4c41f89382be90e6923a07290fb07562858db41a7252216183b8239a9e380	6	\N	2025-10-10 11:37:05.913216	2025-10-11 11:37:05.913216	f	\N
3	muhammed.sinan@metu.edu.tr	sinan	$2b$10$ty89XStulK1k7dHVmgklMucIOZb5AS/L9PxrRvVC3FuGZGXBrFk1e	40565d29be8bc658613ca9271eac0a3b9594beac2f54f7f7e012ab914427830e	5	\N	2025-10-10 11:40:03.552862	2025-10-11 11:40:03.552862	f	\N
4	muhammed.sinan@metu.edu.tr	sin	$2b$10$i5a2x506hzWyWB1786aQauiiDudpP6aZNsCCJ321OmfNZSpG7lZCC	edfb9207833fd266e5ce22c72b27f2849763565a63317e7ec194b4fd2d0cb10d	6	\N	2025-10-10 11:41:58.908481	2025-10-11 11:41:58.908481	f	\N
5	muhammed.sinan@metu.edu.tr	sinan	$2b$10$HWO.1sS.KerRrtYvniEUt.17PxXS82DIHRyAK3AvX5gj0xDG4MlvO	a284ce02056b050f17bf1fbc4d08aaf0529ac994a067d5b7d14c1f1e70970e61	5	\N	2025-10-10 11:45:09.179918	2025-10-11 11:45:09.179918	f	\N
6	muhammed.sinan@metu.edu.tr	sinan	$2b$10$JpnyUu7/8Iy5/d9ol69XLuzdCWsrdlU97qn6kHHUVqpeRcP8vAi.W	eab0ebbed47accc7ba96dc664c7bf3f513f80655144a6392b6a27d702f2d27a7	5	\N	2025-10-10 11:55:47.279722	2025-10-11 11:55:47.279722	f	\N
7	muhammed.sinan@metu.edu.tr	sinan	$2b$10$pxjH1xTQsEWQLcdBOMjPMesjv5H1dmoNw/gObSLsJsJYe4ZkNcQNu	5c6d9fc8e1fc543545f8c86fc495a288e92109f602da77da16d7a09354be0566	6	\N	2025-10-10 12:04:07.582765	2025-10-11 12:04:07.582765	f	\N
8	muhammed.sinan@metu.edu.tr	sinan	$2b$10$zU7/AhTDW1T0nG1sKJ2CXO3rC9FQkpbZAtof.mfOVADl/KjEkhg9.	f4e9c343480819048a2f935636d73fd72b5803ad8c051c6585300b486512e74c	6	\N	2025-10-10 12:08:36.159361	2025-10-11 12:08:36.159361	f	\N
9	muhammed.sinan@metu.edu.tr	sinan	$2b$10$dstU.XJgK8IKjzGNTFjgv.65V7k1nnKMkss4ajZWBj9QQsHE3pXDO	59ca8619593da1cdbffe95688af736fcfe752a3d6621dbbbde5440b4eb1618be	6	\N	2025-10-10 12:10:47.202143	2025-10-11 12:10:47.202143	t	2025-10-10 12:11:29.063519
\.


--
-- TOC entry 3743 (class 0 OID 17084)
-- Dependencies: 242
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.password_reset_tokens (id, token, user_id, expires_at, created_at) FROM stdin;
8	ec3284a641472b28bc5c18a88cb0fb695043b82370054005c34e9bd2b19436be	9	2025-09-02 15:56:14.908+03	2025-09-02 14:56:14.991843+03
\.


--
-- TOC entry 3739 (class 0 OID 17021)
-- Dependencies: 238
-- Data for Name: peer_review_scores; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.peer_review_scores (score_id, review_id, criterion_id, score, feedback) FROM stdin;
5	5	9	5	I suppose it works.
6	5	10	3	It is horrid.
7	8	9	4	afsfafssfa
8	8	10	10	asfsafas
9	7	9	8	fsdafasddfs
10	7	10	2	dfsafdsaafds
11	11	9	5	So, for precision, your function seems to be on the right track with the concept of generating permutations. However, the implementation can be a bit unclear. Make sure to add comments or docstrings to explain what each part of your code is doing. This will help both you and others understand the logic behind your solution better.
12	11	10	4	When it comes to Big O, your current implementation might have a high time complexity due to creating many unnecessary permutations. Think about how you can optimize the algorithm to reduce redundant calculations. Try to analyze the efficiency of your recursive calls and see if there's a way to make it more streamlined.
13	12	9	4	weak
14	12	10	4	bad
15	13	9	4	weak
16	13	10	4	weak
17	14	9	4	weak
18	14	10	4	weak
19	15	9	4	It works partially some extreme cases dont work
20	15	10	2	big o is bad uses n^2
21	16	9	4	the extreme cases dont work
22	16	10	2	bad big o, uses n^2
23	17	9	8	Good
24	17	10	7	Nice
25	19	9	4	Partially does what it does
26	19	10	4	Not provided
27	18	9	2	weak
28	18	10	2	weak
29	20	11	6	Code runs but doesn't meet requirements. Basic functions present but flawed logic.
30	20	12	5	Poor variable names, no documentation, very basic structure.
31	20	13	5	Flawed search logic, missing core functionality like dictionaries and sets.\n
32	20	14	4	Only one basic comment, no function documentation or README.
33	22	11	6	Bad
34	22	12	5	Bad
35	22	13	5	Bad
36	22	14	4	Bad
\.


--
-- TOC entry 3737 (class 0 OID 16997)
-- Dependencies: 236
-- Data for Name: peer_reviews; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.peer_reviews (review_id, submission_id, reviewer_id, overall_feedback, total_score, status, assigned_date, completed_date, is_ai_generated, ai_model_used, generated_by_instructor, ai_feedback_synthesis) FROM stdin;
5	3	8	Improve!!	8	completed	2025-08-10 13:37:25.160076+03	2025-08-10 13:38:49.023631+03	f	\N	\N	\N
6	4	9	\N	\N	in_progress	2025-08-10 13:37:25.160076+03	\N	f	\N	\N	\N
20	19	15	"This submission doesn't meet the assignment requirements. The code only uses a basic list and doesn't implement dictionaries or sets as required. There's no grade management system, no course tracking, and no error handling. The variable names are unclear and there's no documentation. The functions don't work properly - the find function will print 'not found' for every student except the last one checked. This needs significant improvement to meet the basic requirements."	20	completed	2025-09-25 16:16:20.92276+03	2025-09-25 16:20:21.165667+03	f	\N	\N	The main strengths of the submission include that the code runs and basic functions are present. However, the weaknesses are significant. The submission fails to meet assignment requirements by lacking essential elements like dictionaries and sets, a grade management system, course tracking, and error handling. The code's functionality is flawed with unclear variable names and flawed search logic. Documentation is lacking, with minimal comments and no function documentation or README provided. Overall, the submission requires substantial improvement to align with basic requirements. Key areas for improvement include implementing missing functionalities, improving code quality and style, enhancing algorithm logic, and adding thorough documentation throughout the codebase.
8	6	8	fasf	14	completed	2025-08-10 13:58:12.583715+03	2025-08-10 14:06:44.563912+03	f	\N	\N	\N
7	5	8	fdasdfs	10	completed	2025-08-10 13:55:43.628508+03	2025-08-10 14:32:17.173941+03	f	\N	\N	\N
9	7	8	\N	\N	in_progress	2025-08-20 13:59:04.428081+03	\N	f	\N	\N	\N
10	8	8	\N	\N	in_progress	2025-09-02 13:25:12.654538+03	\N	f	\N	\N	\N
11	8	7	Hey there! I took a look at your Algo 2 test submission. I see you've started on the bad_permutations function. It's great that you're diving into recursion! However, there are some areas where we can improve to make this function more efficient and readable.	9	completed	2025-09-02 13:36:32.315095+03	2025-09-02 13:36:32.315095+03	t	gpt-3.5-turbo	7	\N
22	19	17	Bad	20	completed	2025-09-25 21:55:27.07794+03	2025-09-25 21:58:11.672674+03	f	\N	\N	\N
23	20	14	\N	\N	assigned	2025-10-10 11:01:24.847504+03	\N	f	\N	\N	\N
12	9	9	improve	8	completed	2025-09-22 11:16:33.809233+03	2025-09-22 11:17:03.909333+03	f	\N	\N	\N
24	19	20	\N	\N	assigned	2025-10-10 11:01:24.847504+03	\N	f	\N	\N	\N
25	19	22	\N	\N	assigned	2025-10-10 11:10:40.389405+03	\N	f	\N	\N	\N
13	10	8	improve	8	completed	2025-09-22 11:34:05.688546+03	2025-09-22 11:34:58.617658+03	f	\N	\N	\N
14	11	8	test	8	completed	2025-09-22 11:50:37.566976+03	2025-09-22 11:51:06.174335+03	f	\N	\N	\N
15	12	9	Not a very good one	6	completed	2025-09-22 12:33:00.333278+03	2025-09-22 12:34:43.987896+03	f	\N	\N	\N
16	13	8	improve more	6	completed	2025-09-22 12:37:14.025352+03	2025-09-22 12:38:14.032673+03	f	\N	\N	The main strengths in the feedback include a clear directive to "improve more," indicating a recognition of potential growth and development. However, the weaknesses highlighted are significant. The feedback points out that extreme cases are not effectively handled, impacting the precision of the work. Additionally, the use of a bad Big O notation, specifically utilizing n^2, is noted as a critical weakness. Overall, the assessment emphasizes the need for substantial improvement in precision and algorithmic efficiency. To address these weaknesses, focusing on refining extreme case handling and optimizing algorithms for better time complexity would be crucial for enhancing overall performance.
17	15	8	Nice	15	completed	2025-09-22 13:14:00.994797+03	2025-09-22 13:30:11.146524+03	f	\N	\N	The main strengths highlighted in the feedback are precision and understanding of Big O notation, with positive remarks such as "Good" and "Nice" in these areas. However, the feedback lacks specific details or examples to provide context or actionable insights for improvement. To enhance your performance, consider seeking more detailed feedback to pinpoint areas for growth and actively incorporating this feedback into your practice. Overall, your grasp of precision and Big O notation is acknowledged, but further feedback and practice could help you refine your skills in a more targeted manner.
19	16	9	Improve	8	completed	2025-09-23 12:01:55.040856+03	2025-09-23 12:03:17.109988+03	f	\N	\N	The main strengths highlighted in the feedback include partially achieving the task at hand, indicating some level of proficiency. However, the feedback also points out key areas for improvement. The lack of providing Big O notation is identified as a weakness that needs attention. Overall, there is a need to work on precision and incorporating Big O notation into the work. To enhance performance, focus on improving precision in tasks and ensuring the inclusion of Big O notation for better algorithm analysis. By addressing these weaknesses, overall performance can be significantly improved.
18	16	8	weak	4	completed	2025-09-23 12:01:52.62544+03	2025-09-23 12:04:47.567423+03	f	\N	\N	The main strengths highlighted in the feedback are not explicitly mentioned. However, the key weaknesses identified focus on Precision and Big O concepts, both assessed as weak. To improve, consider practicing and deepening your understanding of these areas. Overall, the assessment indicates a need to work on enhancing Precision and Big O notation concepts to strengthen your performance in these criteria. Engaging in targeted practice and seeking additional resources could help you address these weaknesses effectively and improve your overall proficiency in these areas.
\.


--
-- TOC entry 3751 (class 0 OID 33231)
-- Dependencies: 250
-- Data for Name: pending_enrollment_requests; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.pending_enrollment_requests (request_id, course_id, student_id, student_name, student_email, status, requested_at, reviewed_at, reviewed_by, rejection_reason) FROM stdin;
1	6	22	testddd	hah@hah.com	approved	2025-10-10 10:38:13.416271+03	2025-10-10 10:38:49.689894+03	7	\N
2	6	23	testddd22	tehaha@haha.com	approved	2025-10-10 10:44:09.988994+03	2025-10-10 10:52:55.890965+03	7	\N
4	6	25	sinan	muhammed.sinan@metu.edu.tr	pending	2025-10-10 12:11:29.063519+03	\N	\N	\N
\.


--
-- TOC entry 3729 (class 0 OID 16923)
-- Dependencies: 228
-- Data for Name: rubric_criteria; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.rubric_criteria (criterion_id, rubric_id, name, description, max_points, weight, created_at, updated_at) FROM stdin;
10	3	Big O	\N	10	1.00	2025-08-10 13:34:57.462673+03	2025-09-02 13:17:47.472974+03
9	3	Precision	\N	10	1.00	2025-08-10 13:34:57.405401+03	2025-09-02 13:17:47.500614+03
11	4	Code Functionality	Does the code execute correctly and produce the expected output? Are all requirements met?	30	1.00	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
12	4	Code Quality & Style	Is the code well-structured, readable, and following Python best practices (PEP 8)?	25	1.00	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
13	4	Algorithm & Logic	Are the algorithms efficient and logical? Is the problem-solving approach sound?	25	1.00	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
14	4	Documentation & Comments	Are functions documented? Are comments clear and helpful? Is there a proper README?	20	1.00	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
\.


--
-- TOC entry 3731 (class 0 OID 16940)
-- Dependencies: 230
-- Data for Name: rubric_performance_levels; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.rubric_performance_levels (level_id, criterion_id, description, points, order_position, created_at, updated_at) FROM stdin;
49	10	Does not meet expectations	2	1	2025-09-02 13:17:47.494049+03	2025-09-02 13:17:47.494049+03
50	10	Partially meets expectations	4	2	2025-09-02 13:17:47.501728+03	2025-09-02 13:17:47.501728+03
51	10	Meets expectations	7	3	2025-09-02 13:17:47.511287+03	2025-09-02 13:17:47.511287+03
52	9	Does not meet expectations	2	1	2025-09-02 13:17:47.517262+03	2025-09-02 13:17:47.517262+03
53	10	Exceeds expectations	10	4	2025-09-02 13:17:47.521518+03	2025-09-02 13:17:47.521518+03
54	9	Partially meets expectations	4	2	2025-09-02 13:17:47.526243+03	2025-09-02 13:17:47.526243+03
55	9	Meets expectations	8	3	2025-09-02 13:17:47.534025+03	2025-09-02 13:17:47.534025+03
56	9	Exceeds expectations	10	4	2025-09-02 13:17:47.541524+03	2025-09-02 13:17:47.541524+03
57	11	Excellent: Code runs perfectly, handles edge cases, all requirements exceeded	30	1	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
58	11	Good: Code runs well with minor issues, most requirements met	24	2	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
59	11	Satisfactory: Code runs with some issues, basic requirements met	18	3	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
60	11	Needs Improvement: Code has significant issues, some requirements missing	12	4	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
61	11	Unsatisfactory: Code doesn't run or major requirements missing	6	5	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
62	12	Excellent: Perfect code style, very readable, follows all best practices	25	1	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
63	12	Good: Good code style with minor issues, mostly readable	20	2	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
64	12	Satisfactory: Acceptable code style, somewhat readable	15	3	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
65	12	Needs Improvement: Poor code style, hard to read	10	4	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
66	12	Unsatisfactory: Very poor code style, unreadable	5	5	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
67	13	Excellent: Highly efficient algorithms, excellent problem-solving approach	25	1	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
68	13	Good: Good algorithms with minor inefficiencies, solid approach	20	2	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
69	13	Satisfactory: Acceptable algorithms, basic problem-solving	15	3	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
70	13	Needs Improvement: Inefficient algorithms, poor logic	10	4	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
71	13	Unsatisfactory: Very poor algorithms, flawed logic	5	5	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
72	14	Excellent: Comprehensive documentation, clear comments, excellent README	20	1	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
73	14	Good: Good documentation with minor gaps, clear comments	16	2	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
74	14	Satisfactory: Basic documentation, some helpful comments	12	3	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
75	14	Needs Improvement: Minimal documentation, few comments	8	4	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
76	14	Unsatisfactory: No documentation, no meaningful comments	4	5	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
\.


--
-- TOC entry 3726 (class 0 OID 16896)
-- Dependencies: 225
-- Data for Name: rubrics; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.rubrics (rubric_id, name, description, created_at, updated_at) FROM stdin;
3	Algo Rubric	testing	2025-08-10 13:34:56.998559+03	2025-09-02 13:17:46.846538+03
4	Python Programming Rubric	Assessment criteria for Python programming assignments including code quality, functionality, and documentation.	2025-09-25 16:00:15.901462+03	2025-09-25 16:00:15.901462+03
\.


--
-- TOC entry 3735 (class 0 OID 16982)
-- Dependencies: 234
-- Data for Name: submission_attachments; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.submission_attachments (attachment_id, submission_id, file_name, file_path, file_size, file_type, upload_date) FROM stdin;
\.


--
-- TOC entry 3733 (class 0 OID 16958)
-- Dependencies: 232
-- Data for Name: submissions; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.submissions (submission_id, assignment_id, student_id, title, content, submission_date, status, ai_submission_analysis, aggregated_feedback_synthesis, aggregated_synthesis_generated_at) FROM stdin;
4	5	8	Algo [StudentA]	<p>def factorial(n):<br>&nbsp; &nbsp; if not isinstance(n, int) or n &lt; 0:<br>&nbsp; &nbsp; &nbsp; &nbsp; raise ValueError("n must be a non-negative integer")<br>&nbsp; &nbsp;&nbsp;<br>&nbsp; &nbsp; result = 1<br>&nbsp; &nbsp; for i in range(2, n + 1):<br>&nbsp; &nbsp; &nbsp; &nbsp; result *= i<br>&nbsp; &nbsp; return result</p>\n<p><br># Example<br>print(factorial(5)) &nbsp;# Output: 120</p>	2025-08-10 13:37:07.983619+03	submitted	\N	\N	\N
3	5	9	Algo [StudentB]	<p>def factorial(n):<br><br>&nbsp; &nbsp; nums = [i for i in range(1, n + 1)]<br>&nbsp; &nbsp;&nbsp;<br><br>&nbsp; &nbsp; result = 1<br>&nbsp; &nbsp; while len(nums) &gt; 0:<br>&nbsp; &nbsp; &nbsp; &nbsp; result *= nums.pop(0) &nbsp;# popping from front of list = O(n) each time<br>&nbsp; &nbsp;&nbsp;<br><br>&nbsp; &nbsp; print("Debug: Final result is", result, "after", n, "iterations.")<br>&nbsp; &nbsp;&nbsp;<br>&nbsp; &nbsp; return result</p>\n<p><br># Example<br>print(factorial(5))</p>	2025-08-10 13:36:25.959065+03	reviewed	\N	\N	\N
6	7	9	fasdasdffdsa	<p>fdsasdfasdaf</p>	2025-08-10 13:57:59.657933+03	reviewed	\N	\N	\N
5	6	9	asfasf	<p>asfasf</p>	2025-08-10 13:55:29.142556+03	reviewed	\N	\N	\N
7	9	9	afssaffas	<p>asfasfasasf</p>	2025-08-20 13:58:45.610042+03	submitted	\N	\N	\N
8	10	9	Student A Algo 2	<p><br>def bad_permutations(lst):<br>&nbsp; &nbsp; if len(lst) == 0:<br>&nbsp; &nbsp; &nbsp; &nbsp; return [[]]<br>&nbsp; &nbsp; result = []<br>&nbsp; &nbsp; for i in range(len(lst)):<br>&nbsp; &nbsp; &nbsp; &nbsp; rest = bad_permutations(lst[:i] + lst[i+1:])&nbsp;<br>&nbsp; &nbsp; &nbsp; &nbsp; for r in rest:<br><br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; result.append([lst[i]] + r)<br><br>&nbsp; &nbsp; return list(set(tuple(x) for x in result))</p>	2025-09-02 13:20:11.590054+03	reviewed	\N	\N	\N
9	12	8	fair test chatbox	<p>testing the chatbox</p>	2025-09-22 11:16:17.154698+03	reviewed	\N	\N	\N
10	13	9	testing chatbox 2	<p>test</p>	2025-09-22 11:33:33.62232+03	reviewed	\N	\N	\N
11	15	9	haha	<p>asdasd</p>	2025-09-22 11:49:51.317029+03	reviewed	\N	\N	\N
12	17	8	test 44 fair	<p>test</p>	2025-09-22 12:32:21.839543+03	reviewed	\N	\N	\N
13	17	9	test 44 muh	<p>safasfasf</p>	2025-09-22 12:36:56.083994+03	reviewed	\N	\N	\N
14	12	9	testatastatastast	<p>asafasf</p>	2025-09-22 13:08:32.428898+03	submitted	The student submission titled "testatastatastast" does not align well with the assignment requirements for a "chatbox test." The content provided, "<p>asafasf</p>," does not demonstrate any testing related to a chatbox. One strength of the submission is that it appears to attempt to provide some content, albeit unrelated to the assignment. To improve, the student should focus on aligning the submission with the assignment requirements by actually testing a chatbox functionality or feature. Specific suggestions for enhancement include outlining a plan for testing the chatbox, executing the tests, and documenting the results. Based on the rubric criteria provided, the student would likely receive a low score as the submission did not address Precision or Big O, which are key aspects of testing and evaluation. Moving forward, the student should ensure to thoroughly understand the assignment requirements and address them accordingly to achieve a higher performance level.	\N	\N
15	18	9	Student A Pointer	<p>#include &lt;iostream&gt;<br>using namespace std;</p>\n<p>int main() {<br>&nbsp; &nbsp; int x = 10; &nbsp; // Step 1<br>&nbsp; &nbsp; int* p; &nbsp; &nbsp; &nbsp; // Step 2<br>&nbsp; &nbsp; p = &amp;x; &nbsp; &nbsp; &nbsp; // Step 3</p>\n<p>&nbsp; &nbsp; cout &lt;&lt; "Value of x: " &lt;&lt; x &lt;&lt; endl;<br>&nbsp; &nbsp; cout &lt;&lt; "Address of x: " &lt;&lt; &amp;x &lt;&lt; endl;<br>&nbsp; &nbsp; cout &lt;&lt; "Pointer p stores: " &lt;&lt; p &lt;&lt; endl;<br>&nbsp; &nbsp; cout &lt;&lt; "Value via pointer (*p): " &lt;&lt; *p &lt;&lt; endl;</p>\n<p>&nbsp; &nbsp; *p = 20; // change value of x using pointer<br>&nbsp; &nbsp; cout &lt;&lt; "New value of x (after *p = 20): " &lt;&lt; x &lt;&lt; endl;</p>\n<p>&nbsp; &nbsp; return 0;<br>}</p>	2025-09-22 13:13:43.32381+03	reviewed	Overall, the student submission partially meets the assignment requirements by demonstrating an understanding of pointers and their usage. The submission successfully declares an integer variable, initializes it, creates a pointer, assigns the address to the pointer, prints the value of the variable, its address, and the value stored in the pointer. However, the submission does not fully address all the requirements, such as declaring two integer variables, swapping values using pointers, and printing the updated values after the swap.\n\nStrengths of the submission include the clear demonstration of pointer usage, including assigning addresses, dereferencing, and changing the value through a pointer. The student also shows an understanding of basic pointer operations.\n\nTo enhance the submission, the student should incorporate the missing elements of the assignment, such as declaring two integer variables, swapping their values using pointers, and printing the updated values after the swap. Additionally, adding comments to explain each step would improve the clarity of the code.\n\nBased on the provided rubric criteria, the student's performance would be considered satisfactory but would benefit from addressing the missing requirements for a higher level of achievement.	\N	\N
16	18	10	Test Pointer	<p>#include &lt;iostream&gt;<br>using namespace std;</p>\n<p>int main() {<br>&nbsp; &nbsp; int x = 10; &nbsp; // Step 1<br>&nbsp; &nbsp; int* p; &nbsp; &nbsp; &nbsp; // Step 2<br>&nbsp; &nbsp; p = &amp;x; &nbsp; &nbsp; &nbsp; // Step 3</p>\n<p>&nbsp; &nbsp; cout &lt;&lt; "Value of x: " &lt;&lt; x &lt;&lt; endl;<br>&nbsp; &nbsp; cout &lt;&lt; "Address of x: " &lt;&lt; &amp;x &lt;&lt; endl;<br>&nbsp; &nbsp; cout &lt;&lt; "Pointer p stores: " &lt;&lt; p &lt;&lt; endl;<br>&nbsp; &nbsp; cout &lt;&lt; "Value via pointer (*p): " &lt;&lt; *p &lt;&lt; endl;</p>\n<p>&nbsp; &nbsp; *p = 20; // change value of x using pointer<br>&nbsp; &nbsp; cout &lt;&lt; "New value of x (after *p = 20): " &lt;&lt; x &lt;&lt; endl;</p>\n<p>&nbsp; &nbsp; return 0;<br>}</p>	2025-09-23 11:59:45.047684+03	reviewed	Overall, the student submission partially meets the assignment requirements. The program correctly declares an integer variable, x, and a pointer, p, and assigns the address of x to the pointer. It successfully prints the value of x, the address of x, the value stored in the pointer, and the value pointed to by the pointer. However, the submission lacks the declaration of a second integer variable, a swap functionality using pointers, and printing the new values of a and b after the swap, which are essential parts of the assignment.\n\nA strength demonstrated in the submission is the correct usage of pointers to access and modify the value of x. The student shows understanding of basic pointer operations.\n\nTo improve the submission, the student should declare a second integer variable, implement the swapping functionality using pointers as required by the assignment, and print the new values of a and b after the swap. Adding comments to explain the purpose of each step would also enhance the clarity of the code.\n\nBased on the rubric criteria, the student's performance would likely fall below expectations due to incomplete implementation of the assignment requirements. With the suggested enhancements, the student has the potential to achieve a higher performance level.	\N	\N
17	13	10	gfdgdfs	<p>gdfsgfds</p>	2025-09-23 13:00:16.97653+03	submitted	The student submission titled "gfdgdfs" did not meet the assignment requirements as outlined in the title and description provided. The content "<p>gdfsgfds</p>" does not align with the expected content for the task. However, a strength demonstrated in the submission is the use of HTML tags to structure content. To improve, make sure to align the title and content with the assignment requirements explicitly stated, such as creating a chatbox test scenario or providing a test plan. For enhancement, consider including detailed steps for testing a chatbox feature, discussing potential test cases, or analyzing the expected outcomes. Based on the rubric criteria provided, the performance level of this submission would be low as it does not address the specified evaluation criteria. Moving forward, ensure to closely follow the assignment guidelines to showcase your understanding of the topic and meet the assessment criteria effectively.	\N	\N
18	18	8	fgdasgdfs	<p>gdfsgfds</p>	2025-09-23 13:01:00.900052+03	submitted	The student submission does not align with the assignment requirements as it lacks the expected program implementation for the Pointer Test task. The content provided appears to be unrelated to the programming task specified. However, this presents an opportunity for improvement. In terms of strengths, the student might have inadvertently demonstrated creativity in titling their submission, but this does not meet the assignment's objectives. Moving forward, it is essential to focus on the task requirements to showcase technical skills effectively. To enhance the submission, I recommend starting by creating a C program that follows the outlined steps, including variable declaration, pointer assignment, value swapping using pointers, and accurate output display. By practicing these fundamental programming concepts, the student can gain a better understanding of pointers and memory manipulation in C. Based on the rubric criteria, the current submission would likely receive a low score due to the lack of alignment with the assignment requirements. With proper implementation, the student has the potential to achieve a higher score by meeting the specified criteria accurately.	\N	\N
20	19	15	Data Structures [Diana]	<p># Student Management System<br># This program manages students using different data structures</p>\n<p>students = {} &nbsp;# Dictionary to store student info<br>courses = set() &nbsp;# Set to track unique courses</p>\n<p><br>def add_student(student_id, name):<br>&nbsp; &nbsp; if student_id in students:<br>&nbsp; &nbsp; &nbsp; &nbsp; print("Student already exists")<br>&nbsp; &nbsp; &nbsp; &nbsp; return False<br>&nbsp; &nbsp; students[student_id] = {"name": name, "grades": [], "courses": set()}<br>&nbsp; &nbsp; print(f"Added student: {name}")<br>&nbsp; &nbsp; return True</p>\n<p><br>def remove_student(student_id):<br>&nbsp; &nbsp; if student_id in students:<br>&nbsp; &nbsp; &nbsp; &nbsp; del students[student_id]<br>&nbsp; &nbsp; &nbsp; &nbsp; print("Student removed")<br>&nbsp; &nbsp; else:<br>&nbsp; &nbsp; &nbsp; &nbsp; print("Student not found")</p>\n<p><br>def search_student(student_id):<br>&nbsp; &nbsp; if student_id in students:<br>&nbsp; &nbsp; &nbsp; &nbsp; return students[student_id]<br>&nbsp; &nbsp; return None</p>\n<p><br>def add_grade(student_id, grade):<br>&nbsp; &nbsp; if student_id in students:<br>&nbsp; &nbsp; &nbsp; &nbsp; students[student_id]["grades"].append(grade)</p>\n<p><br>def calculate_average(student_id):<br>&nbsp; &nbsp; if student_id in students and students[student_id]["grades"]:<br>&nbsp; &nbsp; &nbsp; &nbsp; grades = students[student_id]["grades"]<br>&nbsp; &nbsp; &nbsp; &nbsp; return sum(grades) / len(grades)<br>&nbsp; &nbsp; return 0</p>\n<p><br># Test the functions<br>add_student(1, "John Doe")<br>add_student(2, "Jane Smith")<br>add_grade(1, 85)<br>add_grade(1, 92)<br>print(f"Average: {calculate_average(1)}")</p>	2025-09-25 16:13:46.985865+03	submitted	Overall, the student submission demonstrates a basic implementation of a student management system using dictionaries but falls short of meeting all the assignment requirements. The submission successfully uses dictionaries to store student information and implement basic functions like adding, removing, and searching for students. However, it lacks the implementation of sets for tracking unique courses, error handling, input validation, unit tests, and proper documentation. The code quality is reasonable, but improvements can be made in adhering to PEP 8 guidelines, adding more comments for clarity, and providing docstrings for functions.\n\nStrengths of the submission include a clear attempt at organizing the code into functions and utilizing dictionaries effectively to manage student data. To enhance the submission, the student should focus on incorporating sets for tracking courses, implementing error handling and input validation, writing unit tests to validate functionality, and documenting the code thoroughly with comments and docstrings. Adhering to PEP 8 style guidelines will further improve the code quality.\n\nBased on the rubric criteria, the submission would currently fall into the lower end of the grading scale due to missing key requirements. With enhancements in functionality, code quality, algorithm efficiency, and documentation, the submission has the potential to achieve a higher performance level.	\N	\N
19	19	14	Data Structures [Charlie]	<div>\n<div># student thing</div>\n<div>students = []</div>\n<div>&nbsp; def add():</div>\n<div>&nbsp; &nbsp; name = input("name: ")</div>\n<div>&nbsp; &nbsp; students.append(name)</div>\n<br>\n<div>def find():</div>\n<div>&nbsp; name = input("name: ")</div>\n<div>&nbsp; for s in students:</div>\n<div>&nbsp; &nbsp; if s == name:</div>\n<div>&nbsp; &nbsp; &nbsp; print("found")&nbsp;</div>\n<div>&nbsp; &nbsp; else:</div>\n<div>&nbsp; &nbsp; &nbsp; print("not found")</div>\n<br>\n<div>add()</div>\n<div>find()</div>\n</div>	2025-09-25 16:11:49.508631+03	reviewed	The student submission shows a basic attempt at implementing a student management system using lists in Python. While the code executes and demonstrates some functionality, it falls short of meeting most of the assignment requirements. The submission lacks the implementation of dictionaries and sets as specified in the assignment instructions. Additionally, there are no unit tests, proper error handling, or input validation included. In terms of code quality and style, there are issues with indentation, naming conventions, and overall structure that do not follow PEP 8 guidelines. \n\nOne strength of the submission is the attempt to create functions for adding and searching students, showcasing a beginning understanding of function creation and usage. However, to enhance the submission, the student should focus on incorporating dictionaries for a more efficient student management system, implementing sets for tracking unique courses, adding error handling, and writing unit tests to ensure functionality. Improving code readability by adhering to PEP 8 guidelines and providing clear documentation through comments and docstrings would also be beneficial.\n\nBased on the rubric criteria, the current performance level of the submission would be below expectations, with significant room for improvement in functionality, code quality, algorithm efficiency, and documentation. Encouraging the student to address these areas will lead to a more comprehensive and effective implementation of the assignment requirements.	Overall, consistent feedback from multiple reviewers highlights the following points:\n\nStrengths:\n- The code runs and basic functions are present.\n\nAreas for Improvement:\n- Missing essential elements like dictionaries, sets, grade management system, course tracking, and error handling.\n- Flawed functionality with unclear variable names and faulty search logic.\n- Lack of documentation, including comments, function documentation, and a README file.\n- Need for significant improvement to meet basic requirements, such as fixing the find function logic.\n\nConflicting Feedback:\n- One review simply states "Bad" without specific details, which does not provide actionable feedback for improvement.\n\nTo enhance the submission, focus on implementing missing functionalities, improving code quality and style, revising variable names for clarity, fixing the find function logic, and adding comprehensive documentation throughout the codebase. Addressing these key areas will help align the submission with the assignment requirements and elevate its overall quality.	2025-09-25 21:58:11.672674+03
\.


--
-- TOC entry 3718 (class 0 OID 16832)
-- Dependencies: 217
-- Data for Name: users; Type: TABLE DATA; Schema: peer_assessment; Owner: -
--

COPY peer_assessment.users (user_id, name, email, password_hash, role, created_at, updated_at) FROM stdin;
7	instructor	instructor@test.com	$2b$10$yOlYZaXFcM7..frseGYgHuW7UXa1nUT9edU3DrAjunMYZrLLrR16e	instructor	2025-08-09 15:45:02.793165+03	2025-08-09 15:45:02.793165+03
8	studentA	fairnapse@gmail.com	$2b$10$DqS71CiiKPTaURDYhPvxq.vpR8zzPRfDyIk4FPm.mqHen1mhZLBvm	student	2025-08-10 12:35:13.665754+03	2025-08-10 12:53:49.408979+03
9	studentB	muhammed.sinan0@hotmail.com	$2b$10$Hc7nOKWJvxxgPYJ0lAvDdOZq9n0qRJ5CfnhM7D2XNsTOjpZw7O2Ny	student	2025-08-10 13:33:13.758061+03	2025-08-10 13:33:13.758061+03
10	test	test@test.test	$2b$10$bsQfeJMbJMpjCEvCAjBiCuxY57P12CvGIMPia8S45Jeus1O8wtX2O	student	2025-09-23 11:48:35.918519+03	2025-09-23 11:48:35.918519+03
11	test2	test2@test.test	$2b$10$h.O05.i3iwJvBqoD2GbgxOzw9z.faN6JLTNHZaSCD.KRvopGuU8f6	student	2025-09-23 12:52:43.333887+03	2025-09-23 12:52:43.333887+03
12	Alice Johnson	alice.student@test.com	$2b$12$AvlbkVeUTZ2yhTJ7rQdf5OCRcSKQz5MJrSBiVzELe/W0G1U70BGNG	student	2025-09-25 16:03:43.154757+03	2025-09-25 16:03:43.154757+03
13	Bob Smith	bob.student@test.com	$2b$12$hwQC9l203bmE/6H2BjHnZu82MwXQthRN4ZjbxEXKK0IHOhxb6crTi	student	2025-09-25 16:03:43.154757+03	2025-09-25 16:03:43.154757+03
14	Charlie Davis	charlie.student@test.com	$2b$12$ZbB3dNvXL/6fkHzSdG5IR.Nkfe5GC2SwEywOFf36rnf8faXhXSUBW	student	2025-09-25 16:06:07.366231+03	2025-09-25 16:06:07.366231+03
15	Diana Wilson	diana.student@test.com	$2b$12$ecwVIGRQ84KCBwx.hkT2EOmQtzKOgF/WHcsnq88P/AAD9MrCVEM32	student	2025-09-25 16:06:07.366231+03	2025-09-25 16:06:07.366231+03
16	Ethan Brown	ethan.student@test.com	$2b$12$MY3jhAoGUHlGNbcoC8/qXeVRf5oFJiObjCNjz6vM.9l8ZRuK/sUei	student	2025-09-25 16:06:07.366231+03	2025-09-25 16:06:07.366231+03
17	Fiona Taylor	fiona.student@test.com	$2b$12$n6D8OIkSRukSc0tjpPW41e3YdS/9WlIJN96Ba8b/hSyhbfMZ01K9W	student	2025-09-25 16:06:07.366231+03	2025-09-25 16:06:07.366231+03
18	George Miller	george.student@test.com	$2b$12$ClGrdHmclxcePq78ecIe2uN0YdF4xecy1/t3DnitMo5Lx58OblsVi	student	2025-09-25 16:06:07.366231+03	2025-09-25 16:06:07.366231+03
19	Hannah Garcia	hannah.student@test.com	$2b$12$oLuO/jTrdbkk6IaCTKb28u7bl2yZa/6hn8DTTJZimLl9jsgXguIhq	student	2025-09-25 16:06:07.366231+03	2025-09-25 16:06:07.366231+03
20	Ivan Rodriguez	ivan.student@test.com	$2b$12$/zskwu7pRLHzL7zrGr5e7OniaFP7v7ZGHaMVdaZ0PvZ7wVYYRL3LC	student	2025-09-25 16:06:07.366231+03	2025-09-25 16:06:07.366231+03
21	Julia Martinez	julia.student@test.com	$2b$12$lhQmy3rtycSFRMwdFqGBNurXi3PpFy9HO/SaPWDYV47fw/lNyqa8y	student	2025-09-25 16:06:07.366231+03	2025-09-25 16:06:07.366231+03
22	testddd	hah@hah.com	$2b$10$RJ8NbMoYbqDaU/SzS6tjXekne7QiLSIbDz61KwZnNQWmjmWjHM/cW	student	2025-10-10 10:38:13.416271+03	2025-10-10 10:38:13.416271+03
23	testddd22	tehaha@haha.com	$2b$10$T7yFrrza2WLVdRMOtFvIHOF0xct7XH6Uf.0B0rzmI/IcmMCSevK7a	student	2025-10-10 10:44:09.988994+03	2025-10-10 10:44:09.988994+03
25	sinan	muhammed.sinan@metu.edu.tr	$2b$10$dstU.XJgK8IKjzGNTFjgv.65V7k1nnKMkss4ajZWBj9QQsHE3pXDO	student	2025-10-10 12:11:29.063519+03	2025-10-10 12:11:29.063519+03
26	admin	admin@example.com	$2b$10$..PRoXmXB4gi9cYc9Ydhw.fQQQAergpG8YBEvcLDI3UvZ4LgQpnwa	admin	2025-10-13 13:32:37.859059+03	2025-10-13 13:32:37.859059+03
\.


--
-- TOC entry 3797 (class 0 OID 0)
-- Dependencies: 222
-- Name: assignments_assignment_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.assignments_assignment_id_seq', 19, true);


--
-- TOC entry 3798 (class 0 OID 0)
-- Dependencies: 243
-- Name: chat_conversations_conversation_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.chat_conversations_conversation_id_seq', 30, true);


--
-- TOC entry 3799 (class 0 OID 0)
-- Dependencies: 247
-- Name: chat_message_read_status_read_status_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.chat_message_read_status_read_status_id_seq', 69, true);


--
-- TOC entry 3800 (class 0 OID 0)
-- Dependencies: 245
-- Name: chat_messages_message_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.chat_messages_message_id_seq', 78, true);


--
-- TOC entry 3801 (class 0 OID 0)
-- Dependencies: 220
-- Name: course_enrollments_enrollment_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.course_enrollments_enrollment_id_seq', 23, true);


--
-- TOC entry 3802 (class 0 OID 0)
-- Dependencies: 239
-- Name: course_invitations_invitation_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.course_invitations_invitation_id_seq', 3, true);


--
-- TOC entry 3803 (class 0 OID 0)
-- Dependencies: 218
-- Name: courses_course_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.courses_course_id_seq', 6, true);


--
-- TOC entry 3804 (class 0 OID 0)
-- Dependencies: 251
-- Name: email_verification_tokens_token_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.email_verification_tokens_token_id_seq', 9, true);


--
-- TOC entry 3805 (class 0 OID 0)
-- Dependencies: 241
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.password_reset_tokens_id_seq', 8, true);


--
-- TOC entry 3806 (class 0 OID 0)
-- Dependencies: 237
-- Name: peer_review_scores_score_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.peer_review_scores_score_id_seq', 36, true);


--
-- TOC entry 3807 (class 0 OID 0)
-- Dependencies: 235
-- Name: peer_reviews_review_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.peer_reviews_review_id_seq', 25, true);


--
-- TOC entry 3808 (class 0 OID 0)
-- Dependencies: 249
-- Name: pending_enrollment_requests_request_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.pending_enrollment_requests_request_id_seq', 4, true);


--
-- TOC entry 3809 (class 0 OID 0)
-- Dependencies: 227
-- Name: rubric_criteria_criterion_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.rubric_criteria_criterion_id_seq', 14, true);


--
-- TOC entry 3810 (class 0 OID 0)
-- Dependencies: 229
-- Name: rubric_performance_levels_level_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.rubric_performance_levels_level_id_seq', 76, true);


--
-- TOC entry 3811 (class 0 OID 0)
-- Dependencies: 224
-- Name: rubrics_rubric_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.rubrics_rubric_id_seq', 4, true);


--
-- TOC entry 3812 (class 0 OID 0)
-- Dependencies: 233
-- Name: submission_attachments_attachment_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.submission_attachments_attachment_id_seq', 1, false);


--
-- TOC entry 3813 (class 0 OID 0)
-- Dependencies: 231
-- Name: submissions_submission_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.submissions_submission_id_seq', 20, true);


--
-- TOC entry 3814 (class 0 OID 0)
-- Dependencies: 216
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: peer_assessment; Owner: -
--

SELECT pg_catalog.setval('peer_assessment.users_user_id_seq', 26, true);


--
-- TOC entry 3459 (class 2606 OID 16911)
-- Name: assignment_rubrics assignment_rubrics_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.assignment_rubrics
    ADD CONSTRAINT assignment_rubrics_pkey PRIMARY KEY (assignment_id, rubric_id);


--
-- TOC entry 3454 (class 2606 OID 16889)
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (assignment_id);


--
-- TOC entry 3510 (class 2606 OID 17109)
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (conversation_id);


--
-- TOC entry 3512 (class 2606 OID 17111)
-- Name: chat_conversations chat_conversations_review_id_key; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_conversations
    ADD CONSTRAINT chat_conversations_review_id_key UNIQUE (review_id);


--
-- TOC entry 3524 (class 2606 OID 17160)
-- Name: chat_message_read_status chat_message_read_status_message_id_user_id_key; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_message_read_status
    ADD CONSTRAINT chat_message_read_status_message_id_user_id_key UNIQUE (message_id, user_id);


--
-- TOC entry 3526 (class 2606 OID 17158)
-- Name: chat_message_read_status chat_message_read_status_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_message_read_status
    ADD CONSTRAINT chat_message_read_status_pkey PRIMARY KEY (read_status_id);


--
-- TOC entry 3519 (class 2606 OID 17140)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (message_id);


--
-- TOC entry 3448 (class 2606 OID 16868)
-- Name: course_enrollments course_enrollments_course_id_student_id_key; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.course_enrollments
    ADD CONSTRAINT course_enrollments_course_id_student_id_key UNIQUE (course_id, student_id);


--
-- TOC entry 3450 (class 2606 OID 16866)
-- Name: course_enrollments course_enrollments_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (enrollment_id);


--
-- TOC entry 3495 (class 2606 OID 17066)
-- Name: course_invitations course_invitations_course_id_student_email_key; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.course_invitations
    ADD CONSTRAINT course_invitations_course_id_student_email_key UNIQUE (course_id, student_email);


--
-- TOC entry 3497 (class 2606 OID 17064)
-- Name: course_invitations course_invitations_invitation_token_key; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.course_invitations
    ADD CONSTRAINT course_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- TOC entry 3499 (class 2606 OID 17062)
-- Name: course_invitations course_invitations_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.course_invitations
    ADD CONSTRAINT course_invitations_pkey PRIMARY KEY (invitation_id);


--
-- TOC entry 3446 (class 2606 OID 16853)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);


--
-- TOC entry 3538 (class 2606 OID 33274)
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (token_id);


--
-- TOC entry 3540 (class 2606 OID 33276)
-- Name: email_verification_tokens email_verification_tokens_verification_token_key; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_verification_token_key UNIQUE (verification_token);


--
-- TOC entry 3506 (class 2606 OID 17090)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3508 (class 2606 OID 17092)
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- TOC entry 3491 (class 2606 OID 17028)
-- Name: peer_review_scores peer_review_scores_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.peer_review_scores
    ADD CONSTRAINT peer_review_scores_pkey PRIMARY KEY (score_id);


--
-- TOC entry 3493 (class 2606 OID 17030)
-- Name: peer_review_scores peer_review_scores_review_id_criterion_id_key; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.peer_review_scores
    ADD CONSTRAINT peer_review_scores_review_id_criterion_id_key UNIQUE (review_id, criterion_id);


--
-- TOC entry 3486 (class 2606 OID 17007)
-- Name: peer_reviews peer_reviews_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.peer_reviews
    ADD CONSTRAINT peer_reviews_pkey PRIMARY KEY (review_id);


--
-- TOC entry 3488 (class 2606 OID 17009)
-- Name: peer_reviews peer_reviews_submission_id_reviewer_id_key; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.peer_reviews
    ADD CONSTRAINT peer_reviews_submission_id_reviewer_id_key UNIQUE (submission_id, reviewer_id);


--
-- TOC entry 3534 (class 2606 OID 33243)
-- Name: pending_enrollment_requests pending_enrollment_requests_course_id_student_id_key; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.pending_enrollment_requests
    ADD CONSTRAINT pending_enrollment_requests_course_id_student_id_key UNIQUE (course_id, student_id);


--
-- TOC entry 3536 (class 2606 OID 33241)
-- Name: pending_enrollment_requests pending_enrollment_requests_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.pending_enrollment_requests
    ADD CONSTRAINT pending_enrollment_requests_pkey PRIMARY KEY (request_id);


--
-- TOC entry 3463 (class 2606 OID 16933)
-- Name: rubric_criteria rubric_criteria_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.rubric_criteria
    ADD CONSTRAINT rubric_criteria_pkey PRIMARY KEY (criterion_id);


--
-- TOC entry 3467 (class 2606 OID 16951)
-- Name: rubric_performance_levels rubric_performance_levels_criterion_id_order_position_key; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.rubric_performance_levels
    ADD CONSTRAINT rubric_performance_levels_criterion_id_order_position_key UNIQUE (criterion_id, order_position);


--
-- TOC entry 3469 (class 2606 OID 16949)
-- Name: rubric_performance_levels rubric_performance_levels_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.rubric_performance_levels
    ADD CONSTRAINT rubric_performance_levels_pkey PRIMARY KEY (level_id);


--
-- TOC entry 3457 (class 2606 OID 16905)
-- Name: rubrics rubrics_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.rubrics
    ADD CONSTRAINT rubrics_pkey PRIMARY KEY (rubric_id);


--
-- TOC entry 3480 (class 2606 OID 16990)
-- Name: submission_attachments submission_attachments_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.submission_attachments
    ADD CONSTRAINT submission_attachments_pkey PRIMARY KEY (attachment_id);


--
-- TOC entry 3475 (class 2606 OID 16970)
-- Name: submissions submissions_assignment_id_student_id_key; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.submissions
    ADD CONSTRAINT submissions_assignment_id_student_id_key UNIQUE (assignment_id, student_id);


--
-- TOC entry 3477 (class 2606 OID 16968)
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (submission_id);


--
-- TOC entry 3442 (class 2606 OID 16842)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3444 (class 2606 OID 16840)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3460 (class 1259 OID 17043)
-- Name: idx_assignment_rubrics_assignment_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_assignment_rubrics_assignment_id ON peer_assessment.assignment_rubrics USING btree (assignment_id);


--
-- TOC entry 3461 (class 1259 OID 17044)
-- Name: idx_assignment_rubrics_rubric_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_assignment_rubrics_rubric_id ON peer_assessment.assignment_rubrics USING btree (rubric_id);


--
-- TOC entry 3455 (class 1259 OID 33217)
-- Name: idx_assignments_chat_type; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_assignments_chat_type ON peer_assessment.assignments USING btree (feedback_chat_type);


--
-- TOC entry 3513 (class 1259 OID 25029)
-- Name: idx_chat_conversations_ai; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_chat_conversations_ai ON peer_assessment.chat_conversations USING btree (is_ai_conversation);


--
-- TOC entry 3514 (class 1259 OID 17172)
-- Name: idx_chat_conversations_participant1; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_chat_conversations_participant1 ON peer_assessment.chat_conversations USING btree (participant1_id);


--
-- TOC entry 3515 (class 1259 OID 17173)
-- Name: idx_chat_conversations_participant2; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_chat_conversations_participant2 ON peer_assessment.chat_conversations USING btree (participant2_id);


--
-- TOC entry 3516 (class 1259 OID 17171)
-- Name: idx_chat_conversations_review_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_chat_conversations_review_id ON peer_assessment.chat_conversations USING btree (review_id);


--
-- TOC entry 3517 (class 1259 OID 17174)
-- Name: idx_chat_conversations_updated_at; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_chat_conversations_updated_at ON peer_assessment.chat_conversations USING btree (updated_at DESC);


--
-- TOC entry 3527 (class 1259 OID 17179)
-- Name: idx_chat_message_read_status_message_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_chat_message_read_status_message_id ON peer_assessment.chat_message_read_status USING btree (message_id);


--
-- TOC entry 3528 (class 1259 OID 17178)
-- Name: idx_chat_message_read_status_user_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_chat_message_read_status_user_id ON peer_assessment.chat_message_read_status USING btree (user_id);


--
-- TOC entry 3520 (class 1259 OID 17175)
-- Name: idx_chat_messages_conversation_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_chat_messages_conversation_id ON peer_assessment.chat_messages USING btree (conversation_id);


--
-- TOC entry 3521 (class 1259 OID 17176)
-- Name: idx_chat_messages_sender_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_chat_messages_sender_id ON peer_assessment.chat_messages USING btree (sender_id);


--
-- TOC entry 3522 (class 1259 OID 17177)
-- Name: idx_chat_messages_sent_at; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_chat_messages_sent_at ON peer_assessment.chat_messages USING btree (sent_at DESC);


--
-- TOC entry 3451 (class 1259 OID 17050)
-- Name: idx_course_enrollments_course_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_course_enrollments_course_id ON peer_assessment.course_enrollments USING btree (course_id);


--
-- TOC entry 3452 (class 1259 OID 17051)
-- Name: idx_course_enrollments_student_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_course_enrollments_student_id ON peer_assessment.course_enrollments USING btree (student_id);


--
-- TOC entry 3500 (class 1259 OID 17077)
-- Name: idx_course_invitations_course_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_course_invitations_course_id ON peer_assessment.course_invitations USING btree (course_id);


--
-- TOC entry 3501 (class 1259 OID 17078)
-- Name: idx_course_invitations_email; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_course_invitations_email ON peer_assessment.course_invitations USING btree (student_email);


--
-- TOC entry 3502 (class 1259 OID 17079)
-- Name: idx_course_invitations_token; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_course_invitations_token ON peer_assessment.course_invitations USING btree (invitation_token);


--
-- TOC entry 3541 (class 1259 OID 33278)
-- Name: idx_email_verification_email; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_email_verification_email ON peer_assessment.email_verification_tokens USING btree (email);


--
-- TOC entry 3542 (class 1259 OID 33279)
-- Name: idx_email_verification_expires; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_email_verification_expires ON peer_assessment.email_verification_tokens USING btree (expires_at);


--
-- TOC entry 3543 (class 1259 OID 33277)
-- Name: idx_email_verification_token; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_email_verification_token ON peer_assessment.email_verification_tokens USING btree (verification_token);


--
-- TOC entry 3503 (class 1259 OID 17098)
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_password_reset_tokens_token ON peer_assessment.password_reset_tokens USING btree (token);


--
-- TOC entry 3504 (class 1259 OID 17099)
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_password_reset_tokens_user_id ON peer_assessment.password_reset_tokens USING btree (user_id);


--
-- TOC entry 3489 (class 1259 OID 17049)
-- Name: idx_peer_review_scores_review_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_peer_review_scores_review_id ON peer_assessment.peer_review_scores USING btree (review_id);


--
-- TOC entry 3481 (class 1259 OID 25026)
-- Name: idx_peer_reviews_ai_generated; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_peer_reviews_ai_generated ON peer_assessment.peer_reviews USING btree (is_ai_generated);


--
-- TOC entry 3482 (class 1259 OID 33223)
-- Name: idx_peer_reviews_has_synthesis; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_peer_reviews_has_synthesis ON peer_assessment.peer_reviews USING btree (ai_feedback_synthesis) WHERE (ai_feedback_synthesis IS NOT NULL);


--
-- TOC entry 3483 (class 1259 OID 17048)
-- Name: idx_peer_reviews_reviewer_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_peer_reviews_reviewer_id ON peer_assessment.peer_reviews USING btree (reviewer_id);


--
-- TOC entry 3484 (class 1259 OID 17047)
-- Name: idx_peer_reviews_submission_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_peer_reviews_submission_id ON peer_assessment.peer_reviews USING btree (submission_id);


--
-- TOC entry 3529 (class 1259 OID 33259)
-- Name: idx_pending_enrollment_requests_course_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_pending_enrollment_requests_course_id ON peer_assessment.pending_enrollment_requests USING btree (course_id);


--
-- TOC entry 3530 (class 1259 OID 33262)
-- Name: idx_pending_enrollment_requests_requested_at; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_pending_enrollment_requests_requested_at ON peer_assessment.pending_enrollment_requests USING btree (requested_at DESC);


--
-- TOC entry 3531 (class 1259 OID 33261)
-- Name: idx_pending_enrollment_requests_status; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_pending_enrollment_requests_status ON peer_assessment.pending_enrollment_requests USING btree (status);


--
-- TOC entry 3532 (class 1259 OID 33260)
-- Name: idx_pending_enrollment_requests_student_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_pending_enrollment_requests_student_id ON peer_assessment.pending_enrollment_requests USING btree (student_id);


--
-- TOC entry 3464 (class 1259 OID 17045)
-- Name: idx_rubric_performance_levels_criterion_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_rubric_performance_levels_criterion_id ON peer_assessment.rubric_performance_levels USING btree (criterion_id);


--
-- TOC entry 3465 (class 1259 OID 17046)
-- Name: idx_rubric_performance_levels_order; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_rubric_performance_levels_order ON peer_assessment.rubric_performance_levels USING btree (criterion_id, order_position);


--
-- TOC entry 3478 (class 1259 OID 17082)
-- Name: idx_submission_attachments_submission_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_submission_attachments_submission_id ON peer_assessment.submission_attachments USING btree (submission_id);


--
-- TOC entry 3470 (class 1259 OID 17041)
-- Name: idx_submissions_assignment_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_submissions_assignment_id ON peer_assessment.submissions USING btree (assignment_id);


--
-- TOC entry 3471 (class 1259 OID 33227)
-- Name: idx_submissions_has_aggregated_synthesis; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_submissions_has_aggregated_synthesis ON peer_assessment.submissions USING btree (aggregated_feedback_synthesis) WHERE (aggregated_feedback_synthesis IS NOT NULL);


--
-- TOC entry 3472 (class 1259 OID 33224)
-- Name: idx_submissions_has_analysis; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_submissions_has_analysis ON peer_assessment.submissions USING btree (ai_submission_analysis) WHERE (ai_submission_analysis IS NOT NULL);


--
-- TOC entry 3473 (class 1259 OID 17042)
-- Name: idx_submissions_student_id; Type: INDEX; Schema: peer_assessment; Owner: -
--

CREATE INDEX idx_submissions_student_id ON peer_assessment.submissions USING btree (student_id);


--
-- TOC entry 3573 (class 2620 OID 17181)
-- Name: chat_messages trigger_update_conversation_last_message; Type: TRIGGER; Schema: peer_assessment; Owner: -
--

CREATE TRIGGER trigger_update_conversation_last_message AFTER INSERT ON peer_assessment.chat_messages FOR EACH ROW EXECUTE FUNCTION peer_assessment.update_conversation_last_message();


--
-- TOC entry 3548 (class 2606 OID 16912)
-- Name: assignment_rubrics assignment_rubrics_assignment_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.assignment_rubrics
    ADD CONSTRAINT assignment_rubrics_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES peer_assessment.assignments(assignment_id) ON DELETE CASCADE;


--
-- TOC entry 3549 (class 2606 OID 16917)
-- Name: assignment_rubrics assignment_rubrics_rubric_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.assignment_rubrics
    ADD CONSTRAINT assignment_rubrics_rubric_id_fkey FOREIGN KEY (rubric_id) REFERENCES peer_assessment.rubrics(rubric_id) ON DELETE CASCADE;


--
-- TOC entry 3547 (class 2606 OID 16890)
-- Name: assignments assignments_course_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.assignments
    ADD CONSTRAINT assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES peer_assessment.courses(course_id) ON DELETE CASCADE;


--
-- TOC entry 3563 (class 2606 OID 17117)
-- Name: chat_conversations chat_conversations_participant1_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_conversations
    ADD CONSTRAINT chat_conversations_participant1_id_fkey FOREIGN KEY (participant1_id) REFERENCES peer_assessment.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3564 (class 2606 OID 33218)
-- Name: chat_conversations chat_conversations_participant2_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_conversations
    ADD CONSTRAINT chat_conversations_participant2_id_fkey FOREIGN KEY (participant2_id) REFERENCES peer_assessment.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3565 (class 2606 OID 17112)
-- Name: chat_conversations chat_conversations_review_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_conversations
    ADD CONSTRAINT chat_conversations_review_id_fkey FOREIGN KEY (review_id) REFERENCES peer_assessment.peer_reviews(review_id) ON DELETE CASCADE;


--
-- TOC entry 3568 (class 2606 OID 17161)
-- Name: chat_message_read_status chat_message_read_status_message_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_message_read_status
    ADD CONSTRAINT chat_message_read_status_message_id_fkey FOREIGN KEY (message_id) REFERENCES peer_assessment.chat_messages(message_id) ON DELETE CASCADE;


--
-- TOC entry 3569 (class 2606 OID 17166)
-- Name: chat_message_read_status chat_message_read_status_user_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_message_read_status
    ADD CONSTRAINT chat_message_read_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES peer_assessment.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3566 (class 2606 OID 17141)
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES peer_assessment.chat_conversations(conversation_id) ON DELETE CASCADE;


--
-- TOC entry 3567 (class 2606 OID 17146)
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES peer_assessment.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3545 (class 2606 OID 16869)
-- Name: course_enrollments course_enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.course_enrollments
    ADD CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES peer_assessment.courses(course_id) ON DELETE CASCADE;


--
-- TOC entry 3546 (class 2606 OID 16874)
-- Name: course_enrollments course_enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.course_enrollments
    ADD CONSTRAINT course_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES peer_assessment.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3560 (class 2606 OID 17067)
-- Name: course_invitations course_invitations_course_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.course_invitations
    ADD CONSTRAINT course_invitations_course_id_fkey FOREIGN KEY (course_id) REFERENCES peer_assessment.courses(course_id) ON DELETE CASCADE;


--
-- TOC entry 3561 (class 2606 OID 17072)
-- Name: course_invitations course_invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.course_invitations
    ADD CONSTRAINT course_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES peer_assessment.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3544 (class 2606 OID 16854)
-- Name: courses courses_instructor_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.courses
    ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES peer_assessment.users(user_id);


--
-- TOC entry 3562 (class 2606 OID 17093)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES peer_assessment.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3558 (class 2606 OID 17036)
-- Name: peer_review_scores peer_review_scores_criterion_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.peer_review_scores
    ADD CONSTRAINT peer_review_scores_criterion_id_fkey FOREIGN KEY (criterion_id) REFERENCES peer_assessment.rubric_criteria(criterion_id) ON DELETE CASCADE;


--
-- TOC entry 3559 (class 2606 OID 17031)
-- Name: peer_review_scores peer_review_scores_review_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.peer_review_scores
    ADD CONSTRAINT peer_review_scores_review_id_fkey FOREIGN KEY (review_id) REFERENCES peer_assessment.peer_reviews(review_id) ON DELETE CASCADE;


--
-- TOC entry 3555 (class 2606 OID 25021)
-- Name: peer_reviews peer_reviews_generated_by_instructor_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.peer_reviews
    ADD CONSTRAINT peer_reviews_generated_by_instructor_fkey FOREIGN KEY (generated_by_instructor) REFERENCES peer_assessment.users(user_id);


--
-- TOC entry 3556 (class 2606 OID 17015)
-- Name: peer_reviews peer_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.peer_reviews
    ADD CONSTRAINT peer_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES peer_assessment.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3557 (class 2606 OID 17010)
-- Name: peer_reviews peer_reviews_submission_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.peer_reviews
    ADD CONSTRAINT peer_reviews_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES peer_assessment.submissions(submission_id) ON DELETE CASCADE;


--
-- TOC entry 3570 (class 2606 OID 33244)
-- Name: pending_enrollment_requests pending_enrollment_requests_course_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.pending_enrollment_requests
    ADD CONSTRAINT pending_enrollment_requests_course_id_fkey FOREIGN KEY (course_id) REFERENCES peer_assessment.courses(course_id) ON DELETE CASCADE;


--
-- TOC entry 3571 (class 2606 OID 33254)
-- Name: pending_enrollment_requests pending_enrollment_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.pending_enrollment_requests
    ADD CONSTRAINT pending_enrollment_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES peer_assessment.users(user_id);


--
-- TOC entry 3572 (class 2606 OID 33249)
-- Name: pending_enrollment_requests pending_enrollment_requests_student_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.pending_enrollment_requests
    ADD CONSTRAINT pending_enrollment_requests_student_id_fkey FOREIGN KEY (student_id) REFERENCES peer_assessment.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3550 (class 2606 OID 16934)
-- Name: rubric_criteria rubric_criteria_rubric_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.rubric_criteria
    ADD CONSTRAINT rubric_criteria_rubric_id_fkey FOREIGN KEY (rubric_id) REFERENCES peer_assessment.rubrics(rubric_id) ON DELETE CASCADE;


--
-- TOC entry 3551 (class 2606 OID 16952)
-- Name: rubric_performance_levels rubric_performance_levels_criterion_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.rubric_performance_levels
    ADD CONSTRAINT rubric_performance_levels_criterion_id_fkey FOREIGN KEY (criterion_id) REFERENCES peer_assessment.rubric_criteria(criterion_id) ON DELETE CASCADE;


--
-- TOC entry 3554 (class 2606 OID 16991)
-- Name: submission_attachments submission_attachments_submission_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.submission_attachments
    ADD CONSTRAINT submission_attachments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES peer_assessment.submissions(submission_id) ON DELETE CASCADE;


--
-- TOC entry 3552 (class 2606 OID 16971)
-- Name: submissions submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.submissions
    ADD CONSTRAINT submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES peer_assessment.assignments(assignment_id) ON DELETE CASCADE;


--
-- TOC entry 3553 (class 2606 OID 16976)
-- Name: submissions submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: peer_assessment; Owner: -
--

ALTER TABLE ONLY peer_assessment.submissions
    ADD CONSTRAINT submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES peer_assessment.users(user_id) ON DELETE CASCADE;


-- Completed on 2025-10-13 14:17:05 +03

--
-- PostgreSQL database dump complete
--

\unrestrict ekBDB8b5nfP9sttCj7ncbQzy6jOKOT56NfiLdeGbsHj754CMqwv6mTzfXWLO9Ys

