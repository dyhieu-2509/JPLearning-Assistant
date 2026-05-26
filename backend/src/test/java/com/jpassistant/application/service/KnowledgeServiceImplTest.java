package com.jpassistant.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jpassistant.domain.knowledge.KnowledgeGraphRepository;
import com.jpassistant.domain.knowledge.KnowledgeItem;
import java.util.List;
import org.junit.jupiter.api.Test;

class KnowledgeServiceImplTest {

    @Test
    void searchVocabularyNormalizesInputAndMapsResponse() {
        RecordingRepository repository = new RecordingRepository();
        KnowledgeServiceImpl service = new KnowledgeServiceImpl(repository);

        var result = service.searchVocabulary("  taberu  ", "n5", 100);

        assertThat(repository.lastQuery).isEqualTo("taberu");
        assertThat(repository.lastLevel).isEqualTo("N5");
        assertThat(repository.lastLimit).isEqualTo(50);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).title()).isEqualTo("食べる");
    }

    @Test
    void invalidLevelThrowsDomainValidationError() {
        KnowledgeServiceImpl service = new KnowledgeServiceImpl(new RecordingRepository());

        assertThatThrownBy(() -> service.searchGrammar("", "A1", 10))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("level must be one of");
    }

    private static class RecordingRepository implements KnowledgeGraphRepository {

        private String lastQuery;
        private String lastLevel;
        private int lastLimit;

        @Override
        public List<KnowledgeItem> searchVocabulary(String query, String level, int limit) {
            remember(query, level, limit);
            return List.of(new KnowledgeItem(
                    "Vocabulary",
                    "たべる:N5",
                    "食べる",
                    "たべる",
                    "ăn",
                    "to eat",
                    "N5",
                    "JLPT"
            ));
        }

        @Override
        public List<KnowledgeItem> searchGrammar(String query, String level, int limit) {
            remember(query, level, limit);
            return List.of();
        }

        @Override
        public List<KnowledgeItem> searchKanji(String query, String level, int limit) {
            remember(query, level, limit);
            return List.of();
        }

        private void remember(String query, String level, int limit) {
            this.lastQuery = query;
            this.lastLevel = level;
            this.lastLimit = limit;
        }
    }
}
