-- sqlfluff:dialect:postgres
--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6 (Ubuntu 16.6-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 17.0

-- Started on 2024-12-10 11:15:29

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3420 (class 1262 OID 16394)
-- Name: atchess; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE atchess WITH TEMPLATE = template0 ENCODING = 'UTF8'
LOCALE_PROVIDER = libc LOCALE = 'en_US.UTF-8';


\connect atchess

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- TOC entry 3421 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 219 (class 1255 OID 16447)
-- Name: createaccount(character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.createaccount(uname character varying, pwhash character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
	BEGIN
	IF NOT EXISTS ( SELECT 1 FROM public.users WHERE users.username=uname )
	THEN
		INSERT INTO public.users (username,pwhash) VALUES (uname,pwhash);
		RETURN TRUE;
	END IF;
	RETURN FALSE;
	END;
$$;


--
-- TOC entry 220 (class 1255 OID 16451)
-- Name: trylogin(character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trylogin(uname character varying, pwrdhash character varying) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
declare 
id bigint;
	BEGIN
	 SELECT users.userid into id FROM public.users WHERE users.username=uname AND users.pwhash=pwrdhash limit 1;
	return id;
	END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 16396)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    username character varying NOT NULL,
    userid bigint NOT NULL,
    pwhash character varying NOT NULL,
    wins bigint DEFAULT 0 NOT NULL,
    losses bigint DEFAULT 0 NOT NULL,
    elo integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 3422 (class 0 OID 0)
-- Dependencies: 216
-- Name: COLUMN users.userid; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.userid IS 'internal id';


--
-- TOC entry 3423 (class 0 OID 0)
-- Dependencies: 216
-- Name: COLUMN users.pwhash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.pwhash IS 'hash of passwords. passwords themselves should never be stored.';


--
-- TOC entry 215 (class 1259 OID 16395)
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN userid ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."User_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 218 (class 1259 OID 16407)
-- Name: friendship; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendship (
    friendshipid bigint NOT NULL,
    "sourceId" bigint NOT NULL,
    "targetId" bigint NOT NULL
);


--
-- TOC entry 3424 (class 0 OID 0)
-- Dependencies: 218
-- Name: TABLE friendship; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.friendship IS 'linking object to link two users as friends. WARNING: you have to check both friend1 and friend 2. if person a is friends with person b, then the friendship object could have friend1 be a and friend2 be b, or it could be reversed.';


--
-- TOC entry 3425 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN friendship.friendshipid; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.friendship.friendshipid IS 'internal id';


--
-- TOC entry 217 (class 1259 OID 16406)
-- Name: friendship_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.friendship ALTER COLUMN friendshipid ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.friendship_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 3267 (class 2606 OID 16411)
-- Name: friendship friendship_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_pk PRIMARY KEY (friendshipid);


--
-- TOC entry 3269 (class 2606 OID 16457)
-- Name: friendship friendship_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_unique UNIQUE ("sourceId", "targetId");


--
-- TOC entry 3260 (class 2606 OID 16402)
-- Name: users user_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_pk PRIMARY KEY (userid);


--
-- TOC entry 3262 (class 2606 OID 16404)
-- Name: users user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_unique UNIQUE (username);


--
-- TOC entry 3264 (class 1259 OID 16422)
-- Name: friendship_friend1_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX friendship_friend1_idx ON public.friendship USING btree ("sourceId");


--
-- TOC entry 3265 (class 1259 OID 16423)
-- Name: friendship_friend2_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX friendship_friend2_idx ON public.friendship USING btree ("targetId");


--
-- TOC entry 3263 (class 1259 OID 16405)
-- Name: user_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_username_idx ON public.users USING btree (username);


--
-- TOC entry 3270 (class 2606 OID 16425)
-- Name: friendship friendship1_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship1_user_fk FOREIGN KEY ("sourceId") REFERENCES public.users(userid) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3271 (class 2606 OID 16417)
-- Name: friendship friendship_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_user_fk FOREIGN KEY ("targetId") REFERENCES public.users(userid) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2024-12-10 11:15:29

--
-- PostgreSQL database dump complete
--

CREATE ROLE a
CREATEDB
LOGIN
PASSWORD 'a';

GRANT CONNECT ON DATABASE atchess TO a;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO a;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.friendship TO a;
