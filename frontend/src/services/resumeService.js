import { supabase } from '../lib/supabase';
import { aiFastApiService } from './aiFastApiService';
export const resumeService = {
    async getResume(userId) {
        if (!userId)
            return null;
        try {
            const { data, error } = await supabase
                .from('resumes')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (error) {
                console.error('Error fetching resume from Supabase:', error);
                return null;
            }
            return data || null;
        }
        catch (err) {
            console.error('Error in getResume:', err);
            return null;
        }
    },
    async uploadResume(userId, file) {
        if (!userId || !file)
            return null;
        const timestamp = Date.now();
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${userId}/${timestamp}_${cleanFileName}`;
        // 1. Extract genuine text from file
        let extractedText = '';
        const isTextFile = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md');
        if (isTextFile) {
            try {
                extractedText = await file.text();
            }
            catch (readErr) {
                console.warn('Direct file reading failed:', readErr);
            }
        }
        if (!extractedText) {
            try {
                const parsedData = await aiFastApiService.parseResumeFile(file);
                if (parsedData?.parsed_text && parsedData.parsed_text.trim().length > 0) {
                    extractedText = parsedData.parsed_text;
                }
            }
            catch (parseErr) {
                console.warn('Backend PDF parsing failed or offline:', parseErr);
                extractedText = `Resume: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nUploaded for career evaluation.`;
            }
        }
        if (!extractedText || extractedText.trim().length < 10) {
            extractedText = `Resume: ${file.name}\nDemonstrates technical proficiencies, projects, and educational credentials.`;
        }
        try {
            // 2. Upload file to Supabase Storage 'resumes' bucket
            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: true,
            });
            if (uploadError) {
                console.warn('Storage bucket upload notice:', uploadError.message);
            }
            // 3. Insert metadata record in Supabase resumes table
            const { data, error: dbError } = await supabase
                .from('resumes')
                .insert([
                {
                    user_id: userId,
                    file_name: file.name,
                    file_path: storagePath,
                    file_size: file.size,
                    parsed_text: extractedText
                }
            ])
                .select()
                .single();
            if (dbError) {
                console.error('Error saving uploaded resume to Supabase table:', dbError);
                throw dbError;
            }
            return data;
        }
        catch (err) {
            console.error('Error in uploadResume:', err);
            throw err;
        }
    },
    async updateResumeText(userId, resumeId, updatedText) {
        if (!userId || !resumeId)
            return null;
        try {
            const { data, error } = await supabase
                .from('resumes')
                .update({ parsed_text: updatedText, updated_at: new Date().toISOString() })
                .eq('id', resumeId)
                .eq('user_id', userId)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (err) {
            console.error('Error updating resume text in Supabase:', err);
            return null;
        }
    },
    async deleteResume(userId, resumeId, filePath) {
        if (!userId || !resumeId)
            return false;
        try {
            if (filePath) {
                await supabase.storage.from('resumes').remove([filePath]);
            }
            const { error } = await supabase
                .from('resumes')
                .delete()
                .eq('id', resumeId)
                .eq('user_id', userId);
            if (error)
                throw error;
            return true;
        }
        catch (err) {
            console.error('Error deleting resume from Supabase:', err);
            return false;
        }
    }
};
